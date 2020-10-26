var express = require('express');
var router = express.Router();
// var account=require('../helpers/adduser');
var productHelpers=require('../helpers/product-helpers');
const adduser=require('../helpers/adduser');
const { response } = require('../app');
const { as } = require('pg-promise');
const { json } = require('express');
const verifylogin=(req,res,next)=>{
   if(req.session.loggedIn){
     next()
   }else{
     res.redirect('/login')
  
   }
}


/* GET users listing. */

router.get('/',async function(req, res, next) {
  let user=req.session.user 
  let cartcount=null
  if(req.session.user){
    cartcount=await adduser.getcartcount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
 
    res.render("user/product-views", {products,admin:false,user,cartcount});
    
  })
  
});

//////////////////////UESR REGISTERATION
router.get("/signup",function(req,res){
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/add-user',{admin:false})
  }
  })
router.get("/login",function(req,res){
    if(req.session.loggedIn){
      res.redirect('/')
    }else{
      res.render("user/user-login",{"loginErr":req.session.loginErr})
      req.session.loginErr=false
    }

    })
router.get("/logout",function(req,res){
      req.session.destroy()

      res.redirect("/")
    
  })

router.post("/signup",function(req,res){
  
 adduser.dosignup(req.body).then((response)=>{
   req.session.loggedIn=true
   req.session.user=response
   res.redirect('/')
 })
});
router.post("/login",function(req,res){

  adduser.dologin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true        //user session creating
      req.session.user=response.user   // session creating
      res.redirect('/')
    }else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })
});
router.get('/cart',verifylogin,async(req,res)=>{
let cartcheck=await adduser.cartcheck(req.session.user._id)

if(cartcheck==null){
  res.render('user/null-cart')
}else{
let count=await adduser.procount(req.session.user._id)
if(count!=0){
  let products=await adduser.cartitems(req.session.user._id)
let total=await adduser.totalprice(req.session.user._id)
res.render('user/cart',{products,total,user:req.session.user._id})
}            
else{
   res.render('user/null-cart')
}
}

})

router.get('/add-to-cart/:id',(req,res)=>{
   adduser.addcart(req.params.id,req.session.user._id).then(()=>{
     res.json({status:true})
   })
})
router.post('/change-product-quantity',(req,res,next)=>{
  
   adduser.changequantity(req.body).then(async(response)=>{ 
     
    response.total=await adduser.totalprice(req.body.user)
      res.json(response)
   })
})
router.post('/remove-product-cart',(req,res,next)=>{
  adduser.removecartproduct(req.body).then((response)=>{
         res.json(response)
  })

})
router.get('/cart-checkout',async (req,res)=>{
  let user=req.session.user
  let total=await adduser.totalprice(req.session.user._id)
  res.render('user/checkout',{user,total})
}) 
router.get('/cod',(req,res)=>{
  let user=req.session.user
  res.render('user/payment-cod',{user})
})
router.post('/cod-payment',async(req,res)=>{
  console.log(req.body)
  let user=req.session.user
  let products=await adduser.getcartproductlist(req.session.user._id)
  let totalprice=await adduser.totalprice(req.body.userid)
  adduser.placeorder(req.body,products,totalprice).then((response)=>{
   res.render('user/cod-success',{user})
  })
})
router.get('/orders',async(req,res)=>{
  let orders=await adduser.getorders(req.session.user._id)
  let countitems=orders.length
  if(countitems==0){
    res.render('user/empty-cart')
  }else{
    res.render('user/orderlist',{user:req.session.user,orders})
  }
 
})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await adduser.getorderproduct(req.params.id)
  
  res.render('user/view-order-products',{user:req.session.user,products})
})
router.get('/online',(req,res)=>{
  let user=req.session.user
  res.render('user/payment-online',{user})
})

router.post('/online-razorpay',async(req,res)=>{
  
 
  let products=await adduser.getcartproductlist(req.session.user._id)
  let totalprice=await adduser.totalprice(req.body.userid)
  adduser.placeorder(req.body,products,totalprice).then((orderid)=>{
    adduser.razorpay(orderid,totalprice).then((response)=>{
         res.json(response)
    })
   })
  
})
router.post('/verify-payment',(req,res)=>{
  adduser.verifypayment(req.body).then(()=>{
       adduser.changestatus(req.body['order[receipt]']).then(()=>{
         console.log("payment success")
         res.json({status:true})
       })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})
router.get('/online-success',(req,res)=>{
  res.render("user/payment")
})


module.exports = router;