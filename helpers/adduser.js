var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const { BadGateway } = require('http-errors')
var objectId=require('mongodb').ObjectId
module.exports={
    dosignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{  
            userData.password=await bcrypt.hash(userData.password,10)    //10 salt hashing
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{

                resolve(data.ops[0])

            })     
    })
},
 dologin:(userData)=>{
     return new Promise(async(resolve,reject)=>{
         let loginstatus=false
         let response={}
         let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
         if(user){
             bcrypt.compare(userData.password,user.password).then((status)=>{
                 if(status){
                     console.log("login success")
                     response.user=user
                     response.status=true
                     resolve(response)
                 }else{
                    //  console.log("login failed")
                     resolve({status:false})
                 }

             })
         }else{
             console.log("the user not found")
             resolve({status:false})
            
         }
     })
 },
 addcart:(proid,userid)=>{
     let proobj={
        item:objectId(proid),
        quantity:1,
     }
     return new Promise(async(resolve,reject)=>{
        let usercart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
        if(usercart){
            let proexist=usercart.products.findIndex(product=>product.item==proid)
            console.log(proexist);
            if(proexist!=-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userid),'products.item':objectId(proid)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
            }else{
            
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userid)},
            {
                $push:{products:proobj}
            }
            ).then((response)=>{
                resolve()
            })
            }
        }else{
            let cartobj={
                user:objectId(userid),
                products:[proobj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                resolve()
            })
        }
     })
    
  },
  cartitems:(userid)=>{
      return new Promise(async(resolve,reject)=>{
        let usercart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})//if usercart is there check
          let cartitems=await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                  $match:{user:objectId(userid)}
              },
              {
                  $unwind:'$products'
              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
              },

              {
                  $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'product'
                  }
              },
              {
                  $project:{
                      item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                  }
              }
          
          ]).toArray()
         
          resolve(cartitems)
         
      })
  },
  getcartcount:(userid)=>{
      return new Promise(async(resolve,reject)=>{
          let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
          if(cart){
              count=cart.products.length
           }
        else{
              count=null
        }
          resolve(count)
      })
  },
  changequantity:(details)=>{
      count=parseInt(details.count)
      details.quantity=parseInt(details.quantity)
       return new Promise((resolve,reject)=>{
           if(details.count==-1 && details.quantity==1){
               db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
               {
                   $pull:{products:{item:objectId(details.product)}}
               }).then((response)=>{
                   resolve({removeProduct:true})
               })
    
           }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        {
            $inc:{'products.$.quantity':count}
        }
        ).then((response)=>{
           
            resolve({status:true})
           })
          }
      })
  },
removecartproduct:(details)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
        {
            $pull:{products:{item:objectId(details.product)}}
        }).then((response)=>{
            resolve({removeProduct:true})
        })
    })
},
totalprice:(userid)=>{

    return new Promise(async(resolve,reject)=>{//checking the user is having the cart or not 
       
          let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                  $match:{user:objectId(userid)}
              },
              {
                  $unwind:'$products'
              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
              },

              {
                  $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'product'
                  }
              },
              {
                  $project:{
                      item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                  }
              },
              {
                  $group:{
                      _id:null, 
                      total:{$sum:{$multiply:['$quantity','$product.Price']}}
                  }
              }
          
          ]).toArray()
         
          resolve(total[0].total)
         
      })

},
placeorder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
      console.log(order,products,total)
       let orderobj={
           SHIPPING:{
               mobile:order.mobile,
               address:order.address,
               email:order.email
           },
          userid:objectId(order.userid),
          paymentMethod:order.method,
          products:products,
          totalprice:total
       }
    db.get().collection(collection.ORDER_COLLECTION).insertOne(orderobj).then((response)=>{
        db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userid)})
          resolve()
       })
    })


},
getcartproductlist:(userid)=>{
    
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
       
        resolve(cart.products)
    })
},
getorders:(userid)=>{
    return new Promise(async (resolve,reject)=>{
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userid:objectId(userid)}).toArray()
        resolve(orders)

    })
},
getorderproduct:(orderid)=>{
    return new Promise(async(resolve,reject)=>{
        let orderitems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{_id:objectId(orderid)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },

            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
        
        ]).toArray()
        resolve(orderitems)

    })
}


}
