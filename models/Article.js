const mongoose = require('mongoose');
const slugger = require('slug');
const randomString = require('randomstring');

const Schema = mongoose.Schema;

const articleSchema = new Schema({
  slug: String,
  title: { type: String, required: true },
  description: String,
  body: String,
  tagList: [String],
  favouritesCount: { type: Number, default: 0 },
  author: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

articleSchema.pre("save", async function(next){
  this.slug = slugger(this.title + ' ' + randomString.generate(3));
  next();
})

articleSchema.methods.articleJSON = function(favouriteArticles = [], userFollowing = []){
  let favourited = false;
  if(favouriteArticles.includes(this.id)){
    favourited = true;
  }else{
    favourited = false;
  }
  if(userFollowing.includes(mongoose.Types.ObjectId(this.author.id))){
    this.author.following = true;
  }else{
    this.author.following = false;
  }
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    tagList: this.tagList,
    favourited: favourited,
    favouritesCount: this.favouritesCount,
    author: this.author
  }
}

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;