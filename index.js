const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const Product = require('./models/product');

const app = express();

main()
.then(()=>{
    console.log("connection sucessfully");
})
.catch((err)=>{
    console.log(err);
})

//mongo connection 
 async function main(){
    mongoose.connect("mongodb://localhost:27017/ecommerceRa",{
    });
}
//__________________________________________________
//User schema 

const User = mongoose.model("User" , new mongoose.Schema({
    name : String,
    email : String,
    password : String
}));

//__________________________________________________

//middleware
app.use(bodyParser.urlencoded({extended : true}));
app.use(session({
    secret : "my-secret",
    resave : false,
    saveUninitialized : false
}));

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname , "views"));

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}


//____________________________________________________

//routes for ejs file for render
//signup______________________________
app.get("/signup" , (req ,res)=>{
    res.render("signup");
})

app.post("/signup" , async(req ,res)=>{
    const {name , email , password} = req.body;
    const userExist = await User.findOne({email});
    if(userExist){
        return res.send("User already Exist");
    }
    const newUser = new User({name , email , password});
    await newUser.save();
    res.send(`Signup Sucessfully!`);
});
//__________________________________________________

//login_________________________________________________
app.get("/login" , (req ,res)=>{
    res.render("login.ejs")
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) {
    return res.send("Invalid Email or Password");  // <- return added
  }

  // Save to session
  req.session.userId = user._id;
  req.session.userName = user.name;

  res.redirect('/dashboard');
});

//logout_____________________________________
app.get("/logout" , (req ,res)=>{
    req.session.destroy();
    res.send(`Logout Succesfully <br> <a href="/login">Login</a>`);
})

//Search____________________________________
app.get('/search', (req, res) => {
  res.render('search', { user: null });
});

// Handle search logic
app.post('/search', async (req, res) => {
  const query = req.body.query.trim();
  let user = null;

  if (query.match(/^[0-9a-fA-F]{24}$/)) {
    user = await User.findById(query);
  }

  if (!user) {
    user = await User.findOne({ name: query });
  }

  res.render('search', { user: user || false });
});
//__________________________________________

//dashboard_________________________________

app.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { userName: req.session.userName });
});

//Cart____________________________________________________

app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.render('product', { products });
});

app.post('/add-to-cart/:id', async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return res.redirect('/products');
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const cart = req.session.cart;

  // Check if product already in cart
  const existingItem = cart.find(item => item._id.toString() === id);
  if (existingItem) {
    existingItem.quantity += 1;  // quantity increase
  } else {
    cart.push({ 
      _id: product._id, 
      name: product.name, 
      price: product.price, 
      description: product.description, 
      image: product.image,
      quantity: 1
    });
  }

  req.session.cart = cart;
  res.redirect('/products');
});



app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  res.render('cart', { cart });
});

//remove cart
app.post('/remove-from-cart/:index', (req, res) => {
  const index = parseInt(req.params.index);
  if (req.session.cart && index >= 0 && index < req.session.cart.length) {
    req.session.cart.splice(index, 1);
  }
  res.redirect('/cart');
});


app.listen(8080 , function(){
    console.log("Server is activate 8080");
})


