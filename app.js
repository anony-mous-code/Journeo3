const express=require("express");
const app=express();
const mongoose=require("mongoose");
const newListings=require("./models/listing.js");
const Reviews=require("./models/review.js");
const mongo_URL="mongodb://127.0.0.1:27017/Journeo";
const path=require("path");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const methodOverride=require('method-override');
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
main().then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(mongo_URL);
}
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
app.engine('ejs',ejsMate);
app.get("/",(req,res)=>{
    res.send("Hi , I am a root");
});
// const validateListing=(req,res,next)=>{
//     let{error}=listingSchema.validate(req.body);
//     if(error){
//         let {errMsg}=error.details.map((el)=>el.message).join(",");
//         throw new ExpressError (400,errMsg);
//     }
//     else{
//         next();
//     }
// };
// const validateReview=(req,res,next)=>{
//     let{error}=reviewSchema.validate(req.body);
//     if(error){
//         let {errMsg}=error.details.map((el)=>el.message).join(",");
//         throw new ExpressError (400,errMsg);
//     }
//     else{
//         next();
//     }
// };
//Index Route
app.get("/listings",wrapAsync(async (req,res)=>{
 const allListings= await newListings.find({});
 //console.log(allListings);
  res.render("./listings/index.ejs",{allListings});
}));
//New Route
app.get("/listings/new",(req,res)=>{
res.render("./listings/new.ejs");
});
//Show Route
app.get("/listings/:id",wrapAsync(async (req,res)=>{
let {id}=req.params;
const listing=await newListings.findById(id).populate("reviews");
res.render("./listings/show.ejs",{listing});
}));
//Create Route
app.post("/listings",wrapAsync(async(req,res,next)=>{
   let {title,description,image,price,country,location}=req.body;
if(!req.body.listing){
    throw new ExpressError(400,"Send valid data for listing");
}
let result=listingSchema.validate(req.body);
console.log(result);
   const newListing=new newListings(req.body.listing);
    await newListing.save();
   res.redirect("/listings");

}));
//Edit route
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    let {id}=req.params;
const listing=await newListings.findById(id);
res.render("./listings/edit.ejs",{listing});
}));
//Update Route
app.put("/listings/:id",wrapAsync(async(req,res)=>{
    if(!req.body.listing){
    throw new ExpressError(400,"Send valid data for listing");
}
    let {id}=req.params;
   await  newListings.findByIdAndUpdate(id,{...req.body.listing});
   res.redirect(`/listings/${id}`);
}));
//Delete Route
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
   let deletedListing= await newListings.findByIdAndDelete(id);
   console.log(deletedListing);
    res.redirect("/listings");
}));
//reviews-post method
app.post("/listings/:id/reviews" ,wrapAsync(async(req,res)=>{
let listing =await newListings.findById(req.params.id);
let newReview=new Reviews(req.body.review);
listing.reviews.push(newReview);
await newReview.save();
await listing.save();
res.redirect(`/listings/${listing._id}`);
}));

app.all(/.*/, (req, res, next) => {
           next(new ExpressError(404, "Page Not Found"));
      });
// app.use((err,req,res,next)=>{
//     let {statusCode,message}=err;
//     res.status(statusCode).send(message);
// //res.send("Something went wrong!");
// });
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

app.listen(3000,()=>{
    console.log("server is listening to port 3000");
});
