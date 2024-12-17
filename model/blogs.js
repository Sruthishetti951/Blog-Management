const { default: mongoose } = require("mongoose");
// const { Module } = require("quill");

const Blogs= mongoose.model('blogs',{
    pageTitle:String,
    heroImageURL:String,
    post:String,
    heroImageFileName:String,
    pageSlug: String
});

module.exports=Blogs;