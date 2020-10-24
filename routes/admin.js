var express = require('express');
const {render} =require('../app');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const { route } = require('./user');
const { as } = require('pg-promise');



router.get('/', function(req, res, next) {

  res.render('admin/login', {admin:true});
  
});
router.post('/login', function(req, res) {
let details=req.body;
console.log(details)
if(details.username=="Libin" && details.password=="12345"){
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products', {products,admin:true});
    })
}else{
  console.log("login failed")
}

});

router.get("/add-product",function(req,res){

res.render("admin/add-products",{admin:true})

})

router.post('/add-product',(req,res)=>{
  var data=req.body
 productHelpers.addProduct(data,(id)=>{

  let image=req.files.image
  
  image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
    if(!err){
      res.render("admin/add-products",{admin:true})
    }else{
      console.log(err);
    }

  })
})
})

router.get('/delete-product/:id',(req,res)=>{
  let productid=req.params.id
  productHelpers.delete(productid).then((response)=>{
    res.redirect('/admin/')
  })
  
})
router.get('/edit-product/:id',async (req,res)=>{
  let proedit=req.params.id  //req.params.id is always return when a id is passed through the href
  let product=await productHelpers.getproduct(proedit)
  res.render("admin/Edit",{product,admin:true})
})

router.post('/edit-product/:id',(req,res)=>{
let id=req.params.id
productHelpers.editproduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin')
  if(req.files.image){
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg')
  }
})
})
router.get('/all-orders',(req,res)=>{
 productHelpers.pickorders().then((items)=>{
    res.render('admin/all-orders',{items,admin:true})
 })

})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await productHelpers.getorderproduct(req.params.id)
  res.render('admin/order-products',{user:req.session.user,products})
})
router.get('/all-users',(req,res)=>{
  productHelpers.getallusers().then((users)=>{
    res.render('admin/listusers',{users,admin:true})
  })
})

module.exports = router;
