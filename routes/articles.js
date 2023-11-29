const express = require('express');
const Article = require('../models/Article');
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const slugger = require('slug');
const randomString = require('randomstring');
const router = express.Router();


/* article filters */

router.get('/', auth.optionalVerify, async (req, res, next) => {
  var limit = Number(req.query.limit) || 20;
  var skip = Number(req.query.skip) || 0;
  var queryArticle = {};
  try{
    if(req.query.tags) {
      queryArticle.tagList = req.query.tags;
      // {tags: "node"} -> queryArticle
    }
    if(req.query.author) {
      var author = await User.findOne({username: req.query.author});
      queryArticle.author = author.id;
      //{tags: "node", author: "7346543564564"}
    }
    // favourited
    if(req.user && req.query.favourited){
      var user = await User.findOne({username: req.query.favourited});
      queryArticle._id = {$in: user.favouriteArticles};
    }
  //{tags: "node", author: "7346543564564", favorited: "7645457574535"}
    var articles = await Article.find(queryArticle).skip(skip).limit(limit).populate('author',"_id username bio image");
    let result = [];
    if(req.user){
      articles.forEach(article => {
        result.push(article.articleJSON(req.user.favouriteArticles, req.user.followers));
      })
    }else{
      articles.forEach(article => {
        result.push(article.articleJSON());
      })
    }
    res.status(201).json({ articles: result });
  }catch(error){
    next(error);
  }
});


/* article filters */


// get articles feed

router.get('/feed', auth.verifyToken, async (req, res, next) => {
  let id = req.user.userId;
  let limit = offset = 0;
  let result = [];
  if(req.query.limit){
    limit = Number(req.query.limit);
  }
  if(req.query.offset){
    offset = Number(req.query.offset);
  }
  let followedUserIds = await User.find({followers: {$in: id}}).distinct('_id');
  let articles = await Article.find({author: {$in: followedUserIds}}).populate("author", "_id username bio image").limit(limit).skip(offset);
  articles.forEach(article => {
    result.push(article.articleJSON(req.user.favouriteArticles, req.user.followers));
  })
  return res.status(201).json({ result });
})

// create article

router.post('/', auth.verifyToken, async (req, res, next) => {
  req.body.article.author = req.user.userId;
  try{
    let article = await Article.create(req.body.article);
    let user = await User.findById(req.user.userId);
    article = await article.populate('author', '_id username bio image');
    res.status(201).json({ article: article.articleJSON() });
  }catch(error){
    next(error);
  }
});

// create article

// get article

router.get('/:slug', async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug }).populate('author', 'username bio image following');
    res.status(201).json({ article: article.articleJSON() });
  }catch(error){
    next(error);
  }
});


//edit article

router.put('/:slug', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug });
    if(!article){
      return res.status(400).json({ error: "No article found" });
    }else{
      if(req.body.article.title){
        article.title = req.body.article.title;
      }else if(req.body.article.body){
        article.body = req.body.article.body;
      }else if(req.body.article.tagList){
        article.tagList = req.body.article.tagList;
      }else if(req.body.article.description){
        article.description = req.body.article.description;
      }
      let user = await User.findById(req.user.userId);
      if(article.author.toString() === user.id){
        let updatedArticle = await article.save();
        updatedArticle = await updatedArticle.populate('author');
        res.status(201).json({ article: updatedArticle.articleJSON(user.favouriteArticles) });
      }else{
        res.status(400).json({ error: "You are not the author of this article and can't modify it." });
      }
    }
  }catch(error){
    next(error);
  }
});

// delete article

router.delete('/:slug', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let article = await Article.findOne({ slug });
    let user = await User.findById(req.user.userId);
    if(article.author.toString() === user.id){
      let deletedArticle = await Article.findOneAndDelete({ slug });
      console.log(deletedArticle);
      let updatedUsers = await User.updateMany({$in: { favouriteArticles: deletedArticle.id } }, {$pull: {favouriteArticles: deletedArticle.id}});
      res.status(201).json({ message: "Success article deleted" });
    }else{
      res.status(400).json({ error: "You are not the author of this article and can't modify it." });
    }
  }catch(error){
    next(error);
  }
})

// delete article

//favourite article

router.post('/:slug/favourite', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let user = await User.findById(req.user.userId);
    let favouritedArticle = await Article.findOne({slug});
    if(!user.favouriteArticles.includes(favouritedArticle.id)){
      favouritedArticle = await Article.findOneAndUpdate({ slug }, {$inc: {favouritesCount: 1}}, {new: true}).populate('author', '_id username bio image');
      updatedUser = await User.findByIdAndUpdate(req.user.userId, { $push: {favouriteArticles: favouritedArticle.id } },{ new: true }); 
      res.status(201).json({ article: favouritedArticle.articleJSON(updatedUser.favouriteArticles, req.user.followers) }); 
    }else{
      favouritedArticle = await Article.findOne({ slug }).populate('author', '_id username bio image');
      res.status(201).json({ article: favouritedArticle.articleJSON(user.favouriteArticles, req.user.followers) }); 
    }
  }catch(error){
    next(error);
  }
});

//favourite article

// unfavourite article

router.delete('/:slug/favourite', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  try{
    let user = await User.findById(req.user.userId);
    let favouritedArticle = await Article.findOne({slug});
    if(user.favouriteArticles.includes(favouritedArticle.id)){
      favouritedArticle = await Article.findOneAndUpdate({ slug }, {$inc: {favouritesCount: -1}}, {new: true}).populate('author', '_id username bio image');
      updatedUser = await User.findByIdAndUpdate(req.user.userId, { $pull: {favouriteArticles: favouritedArticle.id } },{ new: true }); 
      res.status(201).json({ article: favouritedArticle.articleJSON(updatedUser.favouriteArticles, req.user.followers) }); 
    }else{
      favouritedArticle = await Article.findOne({ slug }).populate('author', '_id username bio image');
      res.status(201).json({ article: favouritedArticle.articleJSON(user.favouriteArticles, req.user.followers) }); 
    }
  }catch(error){
    next(error);
  }
});

/***** comments *****/

//Add a comment

router.post('/:slug/comments', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  req.body.comment.author = req.user.userId;
  req.body.comment.comment_id = (await Comment.find()).length + 1;
  try{
    let article = await Article.findOne({ slug });
    req.body.comment.article = article.id;
    let comment = await Comment.create(req.body.comment);
    let populatedComment = await comment.populate("author", "username bio image following followers");
    return res.status(201).json({ comment: comment.commentJSON(req.user.followers) });
  }catch(error){
    next(error);
  }
})

// get comments

router.get('/:slug/comments', auth.optionalVerify, async (req, res, next) => {
  let slug = req.params.slug;
  let commentArr = [];
  try{
    let article = await Article.findOne({ slug });
    let comments = await Comment.find({ article: mongoose.Types.ObjectId(article.id) }).populate("author", "username bio image following followers");
    comments.forEach(comment => {
      commentArr.push(comment.commentJSON(req.user.followers));
    });
    res.status(201).json({ comments: commentArr });
  }catch(error){
    next(error);
  }
});

// delete single comment

router.delete('/:slug/comments/:id', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  let id = req.params.id;
  try{
    let comment = await Comment.findOne({comment_id : id});
    if(comment.author.toString() === req.user.userId){
      let deletedComment = await Comment.findOneAndDelete({comment_id: id});
      res.status(201).json({ success: "comment deleted successfully" });
    }else{
      res.status(400).json({ error: "You are not the owner of the comment and can't delete it" });
    }
  }catch(error){
    next(error);
  }
})

//issue here

module.exports = router;