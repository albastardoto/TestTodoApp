var mongoose= require("mongoose");
mongoose.Promise= global.Promise;
//mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/TodoApp", {useMongoClient:true});
mongoose.connect("mongodb://heroku_jkhqmgqz:najtf94a6tk2tuqb5dvomft43u@ds237947.mlab.com:37947/heroku_jkhqmgqz",
{useMongoClient:true});
module.exports={ mongoose }
