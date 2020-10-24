var db=require('../config/connection')
var collection=require('../config/collections')
const { response } = require('express')
var objectId=require('mongodb').ObjectId
module.exports={
// data base adding the product
    addProduct:(product,callback)=>{
        var products={
            name:product.name,
            Category:product.Category,
            description:product.description,
            Price:parseInt(product.Price)

        }
        db.get().collection('product').insertOne(products).then((data)=>{
            callback(data.ops[0]._id)
        })
       

    },
// from data base geting the products
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })
    },
    delete:(productid)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(productid)}).then((response)=>{
               resolve(response)
           })
        })
    },
    getproduct:(editpro)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(editpro)}).then((product)=>{
                
                resolve(product)
            })
        })
    },
    editproduct:(proid,prodetails)=>{
      
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proid)},{
            $set:{
                name:prodetails.name,
                description:prodetails.description,
                Price:prodetails.Price,
                Category:prodetails.Category

            }
            }).then((response)=>{
                resolve()
            })   
        })
    },
pickorders:()=>{
    return new Promise((resolve,reject)=>{
    let orders=db.get().collection(collection.ORDER_COLLECTION).find().toArray()
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
}, 
getallusers:()=>{
    return new Promise((resolve,reject)=>{
        let users=db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
    })
   
   
}

}