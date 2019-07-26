const express = require('express');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Quiz = require('../models/Quiz')
const Sequelize = require('sequelize');
const math = require("math");
const Shop = require('../models/Shop');
const qna = require("../models/QnA")
const Cart = require('../models/Cart');
const moment = require('moment');
const user = require('../models/User')

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
  let date = new Date();
  let nowdate = date.toString().substring(4, 15);
  if (req.user == undefined) {
    console.log('it works!');
  }
  else {
    let id = req.user.id;
    sequelize.query("SELECT * FROM users where id= :ID", { replacements: { ID: id } }, raw = true)
      .then((users) => {
        let currday = users[0][0].signin;
        if (currday != nowdate && users[0][0].isNotAdmin == true) {
          alertMessage(res, 'info', 'Welcome back! Check your profile for a login bonus!', 'fas fa-exclamation-circle', true);
        }
      })
  }
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
  sequelize.query("UPDATE users SET verified = '1' WHERE email = 'admin@gmail.com'")
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
  let id = req.user.id;
  let date = new Date();
  let nowdate = date.toString().substring(4, 15);
  //test date retrieve
  sequelize.query('SELECT quizcompleted FROM users WHERE id= :ID', { replacements: { ID: id } }, raw = true)
    .then(function (compdate) {
      let currday = compdate[0][0].quizcompleted
      if (nowdate != currday) {
        sequelize.query("SELECT * FROM quizzes", raw = true).then(result => {
          let length = result[0].length;
          let getIndex = getRndInteger(0, length - 1);
          let selectedID = result[0][getIndex].id
          sequelize.query("SELECT * FROM quizzes WHERE id = :id ", { replacements: { id: selectedID }, type: sequelize.QueryTypes.SELECT }
          ).then(function (quiz) {
            console.log(quiz)
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
                user: user
              });
          });
        })
          .catch(function (err) {
            res.render('quiz/quiz',
              { title: title })
          });
      }
      else {
        res.render('quiz/quiz',
          { title: title })
      }
    })
});

router.post('/submitedquiz', function (req, res) {
  const title = 'Quiz';
  let ID = req.user.id;
  let user = req.user;
  let points = parseInt(req.body.points);
  let date = new Date();
  let dateday = date.toString().substring(4, 15);
  sequelize.query("UPDATE users SET points= :Points, quizcompleted= :Date WHERE id= :Id", { replacements: { Id: ID, Points: points, Date: dateday } })
    .then((users) => {
      res.redirect('/quiz');
    });
});

router.get('/faq', (req, res) => {
  const title = 'FAQ';
  let isadmin = req.user.isAdmin;
  console.log(isadmin)
  qna.findAll({
    attributes: ['qns', 'ans', 'id']
  },
    raw = true
  ).then((qna) => {
    res.render('faq/faq1', {
      title: title,
      qna: qna,
      isadmin: isadmin
    })
  })
    .catch(function (err) {
      res.render('faq/faq1',
        { title: title })
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
  let user = req.user;
  let id = user.id;
  let date = new Date();
  let nowdate = date.toString().substring(4, 15);

  sequelize.query("SELECT * FROM users WHERE id = :ID", { replacements: { ID: id } }, raw = true)
    .then((user) => {
      let currday = user[0][0].signin
      if (nowdate == currday) {
        res.render('user/profile1', { title: title, user: user[0][0] });
      }
      else {
        nosignin = true;
        res.render('user/profile1', { title: title, user: user[0][0], nosignin: nosignin });
      }
    })
});
router.get('/password', function (req, res) {
  const title = "Password";
  let user = req.user;
  if (user == undefined) {
    alertMessage(res, 'danger', 'User not found! Log in to access password', 'fas fa-check', true);
    res.redirect('/');
  }
  else {
    res.render('user/password1', { title: title });
  }
});
// post rating
router.get('/listrating/:id', function (req, res) {
  const title = "Ratings"
  let id = req.params.id;
  sequelize.query("SELECT * FROM shops WHERE id= :ID", { replacements: { ID: id } }, raw = true).then((shop) => {
    sequelize.query("SELECT * FROM ratings WHERE shopId= :ID",{replacements:{ID:id}}, raw = true).then((ratings) => {
      res.render('shop/listrating', { 
        title: title, 
        shop: shop[0][0], 
        ratings:ratings[0],
        username:ratings[0][0].username,
        date:ratings[0][0].date,
        rating:ratings[0][0].rating,
       });
    }).catch(function(err){
      res.render('shop/listrating',{title:title, shop:shop[0][0]}); 
    });
  });

});

router.post('/postrating/:id', function (req, res) {
  let id = req.params.id;
  let username = req.user.name;
  let date = new Date();
  let currdate = date.toString().substring(4, 15);
  let rating = req.body.rating;
  sequelize.query("INSERT INTO ratings(username, rating, date, shopId) VALUES(:Username, :Rating, :Date, :ID)", { replacements: { Username: username, Rating: rating, Date: currdate, ID:id } })
    .then(() => {
      console.log('it works!')
      res.redirect('/listrating/' + id);
    });
});
//end rating

router.get('/checkout1', function (req, res) {
  const title = "Checkout";
  res.render('Checkout/checkout1', { title: title });
});

router.get('/checkout2', function (req, res) {
  const title = "Checkout";
  res.render('Checkout/checkout2', { title: title });
});

router.get('/checkout3', function (req, res) {
  const title = "Checkout";
  res.render('Checkout/checkout3', { title: title });
});

router.get('/checkout4', function (req, res) {
  const title = "Checkout";
  res.render('Checkout/checkout4', { title: title });
});
module.exports = router;
