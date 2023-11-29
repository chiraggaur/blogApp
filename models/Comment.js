const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  comment_id: Number,
  body: {type: String, required: true},
  author: { type: Schema.Types.ObjectId, ref: "User" },
  article: { type: Schema.Types.ObjectId, ref: "Article" } 
}, { timestamps: true });

commentSchema.methods.commentJSON = function(followers = []){
  if(followers.includes(mongoose.Types.ObjectId(this.author.id))){
    this.author.following = true;
  }else{
    this.author.following = false;
  }
  return {
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: {username: this.author.username, bio: this.author.bio, image: this.author.image, following: this.author.following}
  }
}

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;