const express = require('express');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Quiz = require('../models/Quiz')
const Sequelize = require('sequelize');
const math = require("math");
const Shop = require('../models/Shop');
const qna = require("../models/QnA")
const Cart = require('../models/Cart');

const sequelize = new Sequelize('organic', 'organic', 'green', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  operatorsAliases: false
});

/* GET index */
router.get('/', function (req, res) {
  const title = "NewOrganics";
  /*sequelize.query("SELECT * from users").then(results => {
  console.log(results);
});--- SELECT METHOD*/
  res.render('index', { title: title });
});


router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


router.get('/Login', (req, res) => {
  const title = 'Login';
  sequelize.query("UPDATE users SET isAdmin = '1' WHERE email = 'admin@gmail.com'")
  sequelize.query("UPDATE users SET isNotAdmin = '0' WHERE email = 'admin@gmail.com'")
  res.render('user/login', { title: title })
});


/*User Register*/
router.get('/Register', (req, res) => {
  const title = 'Register';
  res.render('user/register', { title: title })
});

/* NewOrganics Shop */
router.get('/shop', function (req, res) {
  const title = "Shop";
  res.render('shop/shop', { title: title });
});

/* Shop Categories */
router.get('/category', function (req, res) {
  const title = "Category";
  Shop.findAll({
    attributes: ['id', 'name', 'price', 'images', 'description', 'id']
  },
    raw = true
  ).then((shop) => {
    res.render('shop/shopcategory', {
      title: title,
      shop: shop
    })
  })
    .catch(err => console.log(err));
});

/* Add To Cart */
router.get('/addToCart/:id', (req, res) => {
  let id = req.params.id;
  let userId = req.user.id;
  console.log(userId)

  Cart.findOne({ where: { id: id } })
    .then(product => {
      if (product) {
        let quantity = product.quantity + 1;
        Cart.update({
          // Set variables here to save to the videos table
          quantity
        }, {
            where: {
              id: id
            }
          });
      } else {
        let quantity = 1
        Cart.create({ id, quantity, userId })
      }
    });
  return res.redirect('/category');
});

/* Cart */
router.get('/cart', function (req, res) {
  const title = "Cart";
  let userId = req.user.id;

  let items = [];

  Cart.findAll({
    attributes: ['id'],
    where: {
      userId: userId
    }
  }).then(products => {
    for (let i = 0; i < products.length; i++) {
      Shop.findOne({
        attributes: ['name', 'price'],
        where: {
          id: products[i].id
        }
      }).then(item => {
        console.log(item);
        items.push(item.dataValues);
      }).then(console.log(items));
    }
    
  })
res.render('shop/cart', { title: title });
});

/* GET quiz */
router.get('/quiz', function (req, res) {
  const title = "Quiz";
  let user = req.user;
  sequelize.query("SELECT * FROM quizzes", raw = true).then(result => {
    let length = result[0].length;
    let getIndex = getRndInteger(0, length - 1);
    let selectedID = result[0][getIndex].id
    sequelize.query("SELECT * FROM quizzes WHERE id = :id ", { replacements: { id: selectedID }, type: sequelize.QueryTypes.SELECT }
    ).then(function (quiz) {
      res.render('quiz/quiz',
        {
          title: title,
          quiz: quiz,
          option1: quiz[0].option1,
          option2: quiz[0].option2,
          option3: quiz[0].option3,
          option4: quiz[0].option4,
          question: quiz[0].question,
          correct: quiz[0].correct,
          points: user.points
        })
    })
  }).catch(function (err) {
    res.render('quiz/quiz',
      { title: title })
  })
});

router.post('/submitedquiz', function (req, res) {
  const title = 'Quiz';
  let ID = req.user.id;
  let user = req.user;
  let points = parseInt(req.body.points);
  sequelize.query("UPDATE users SET points= :Points  WHERE id= :Id", { replacements: { Id: ID, Points: points } })
    .then((users) => {
      res.render('quiz/quiz', {title:title, points: user.points})
    });
});

router.get('/checkquiz', (req, res) => {
  const title = 'Check';
  res.render('quiz/quiz', { title: title })
})

router.get('/faq', (req, res) => {
  const title = 'FAQ';
  qna.findAll({
    attributes: ['qns', 'ans', 'id']
  },
    raw = true
  ).then((qna) => {
    res.render('faq/faq', {
      title: title,
      qna: qna
    })
  })
    .catch(function(err) {
      res.render('faq/faq',
      {title: title})
    })
});
router.get('/about', (req, res) => {
  const title = "About"
  res.render('about', { title: title });
});

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

router.get('/admin', (req, res) => {
  const title = 'Admin';
  res.render('admin', { title: title })
})

router.get('/profile', function (req, res) {
  const title = "Profile";
  res.render('user/profile1', { title: title });
});
router.get('/password', function (req, res) {
  const title = "Password";
  res.render('user/password1', { title: title });
});
module.exports = router;
