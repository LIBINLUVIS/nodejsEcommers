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
  

}