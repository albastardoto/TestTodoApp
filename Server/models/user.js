var mongoose=require("mongoose");
const validator = require("validator");
const jwt= require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const _ = require("lodash");

let UserSchema = new  mongoose.Schema({
  email:{
    type:String,
    required:true,
    minlength:1,
    trim:true,
    unique:true,
    validate:{
      validator:value=>validator.isEmail(value),
      message:"{VALUE} is not a valid email"
    },
  },
  password:{
    type:String,
    required:true,
    minlength:6
  },
  tokens:[{
    access:{
      type:String,
      required:true
    },
    token:{
      type:String,
      required:true
    }
  }]
});
UserSchema.methods.toJSON = function(){
  let user = this;
  let userObject= user.toObject();
  return _.pick(userObject,["_id","email"]);
};

UserSchema.methods.generateAuthToken= function(){
  var user = this;
  var access="auth";
  var token= jwt.sign({_id:user._id.toHexString(),access},process.env.JWT_SECRET,{expiresIn:"1h"}).toString();
  user.tokens.push({access,token});
  return user.save().then(()=>{
    return token;
  });
};

UserSchema.methods.removeToken=function(token){
  let user= this;
  return user.update({
    $pull:{
      tokens:{token}
    }
  });
}

UserSchema.statics.findByToken=function(token){
  let User = this;
  let decoded;
  try {
    decoded=jwt.verify(token,process.env.JWT_SECRET);
  }catch(e){
    return new Promise((resolve,reject)=>{
      reject();
    })
  }
  return User.findOne({
    _id:decoded._id,
    "tokens.token":token,
    "tokens.access":"auth"
  });
};

UserSchema.statics.findByCredentials= function(email,password){
  let User=this;
  return User.findOne({email}).then((user)=>{
    if(!user){
      return Promise.reject();
    }

    return new Promise((resolve,reject)=>{
      bcrypt.compare(password, user.password,(err,res)=>{
        if(res){
          resolve(user);
        }else{
          reject();
        }
      });
    });
  });
};

UserSchema.pre("save",function(next){
  let user = this;
  if(user.isModified("password")){
    let pass= user.password;
    bcrypt.genSalt(10,(err,salt)=>{
      bcrypt.hash(pass,salt,(err,hash)=>{
        user.password=hash;
        next();
      });
    });
  }else{
    next();
  }
});

var User = mongoose.model("User",UserSchema);

module.exports={User};
