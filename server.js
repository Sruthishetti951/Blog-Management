const express = require('express');
const path = require('path');
const Blogs = require('./model/blogs');
const FileUpload = require('express-fileupload');
const app = express();
const Port = 3000;
const mongoose = require('mongoose');
const { check, expressValidator, validationResult } = require('express-validator');

mongoose.connect('mongodb://localhost:27017/blogsDB');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));
app.use(FileUpload());
let isAdmin = null;

const checkAuthentication = (req, res, next) => {
    // Check if the user is authenticated
    if (isAdmin === null) {
        res.redirect('/home');
    } else if (isAdmin === false) {
        // Pass to user page
        if (req.url?.startsWith('/users')) {
            next();
        } else {
            res.redirect('/users');
        }

    } else {
        next();
    }
};

function getAllPosts(req, res) {
    Blogs.find({}).exec().then(result => {
        const id = req.params?.id;
        let data = (!id && result?.length) ? result?.[0] : undefined;
        if (result?.length && id) {
            const index = result?.findIndex(obj => obj.pageSlug === id);
            if ( index !== -1) {
                data = result[index];
            }
        }
        res.render('post-login/postsList', {
            posts: result,
            selectedPost: data
        })
    }).catch(() => {

    })
}

//create blog
async function postBlog(req, res) {
    const post = req.body.post;
    let errors = validationResult(req).array();
    const image = req.files?.heroImage;
    if (post == '<p><br></p>') {
        errors.push({
            msg: 'Post content is required'
        });
    }
    if (!image?.name) {
        errors.push({
            msg: 'Image is required'
        });
    }

    const pageSlug = req.body.pageSlug;
    const blogListSeo = await Blogs.find({pageSlug: pageSlug}).exec();
    if (blogListSeo?.length > 0) {
        errors.push({
            msg: 'Slug already exist'
        });
    }
    if (errors && errors.length) {
        res.render('post-login/addPage', {
            errors: errors
        })
    } else {
        const actualFilename = image.name;
        let randomString = (Math.random() + 1).toString(36).substring(7);
        const modifiedFileName = `${randomString}-${image.name}`;
        const imagePath = `public/uploads/${modifiedFileName}`;
        image.mv(imagePath, () => {
        });
        const payload = {
            pageTitle: req.body.pageTitle,
            post: req.body.post,
            heroImageURL: imagePath, // this is created in local public folder
            heroImageFileName: actualFilename,
            pageSlug: pageSlug
        }
        const blog = new Blogs(payload);
        blog.save().then((result) => {
            res.redirect('/sucessAddPage');

        }).catch((errorresult) => {
        })
    }
}

//get list of blogs
function getAllBlogs(req, res) {
    Blogs.find({}).exec().then((result) => {
        res.render('post-login/editPage', { lists: result })
    });
}

// Delete blog with ID
function deleteById(req, res) {
    Blogs.deleteOne({ _id: req.params.id }).exec().then((result) => {
        if (result) {
            res.render('post-login/statusPage', {
                message: 'Deleted Successfully',
                backLink: '/editPage'
            });
        }
    }).catch(() => {
        res.render('post-login/statusPage', {
            message: 'Not able to delete ... Something Went wrong ....',
            backLink: '/editPage'
        })
    })
}

// Get blog by Id
function getBlogById(req, res) {
    Blogs.find({pageSlug: req.params.id}).exec().then((result) => {
        res.render('post-login/addPage', {
            blogPost: result?.[0]
        })
    }).catch(() => {
        res.render('post-login/statusPage', {
            message: 'Not able to Get Blog By Id ... Something Went wrong ....',
            backLink: '/editPage'
        })
    })
}

async function postBlogById(req, res) {
    const post = req.body.post;
    const blogPost = await Blogs.find({pageSlug: req.params.id}).exec();
    let errors = validationResult(req).array();
    const image = req.files?.heroImage;
    if (post == '<p><br></p>') {
        errors.push({
            msg: 'Post content is required'
        });
    }
    if (errors && errors.length) {
        res.render('post-login/addPage', {
            blogPost: blogPost[0],
            errors: errors
        })
    } else {

        let actualFilename = '';
        let imagePath = '';
        if (image?.name) {
            actualFilename = image.name;
            let randomString = (Math.random() + 1).toString(36).substring(7);
            const modifiedFileName = `${randomString}-${image.name}`;
            imagePath = `public/uploads/${modifiedFileName}`;
            image.mv(imagePath, (e) => {
            });
        }

        const payload = {
            pageTitle: req.body.pageTitle,
            post: req.body.post,
            heroImageURL: image?.name ? imagePath : req.body.heroImageURL, // this is created in local public folder
            heroImageFileName: image?.name ? actualFilename : req.body.actualFilename
        }
        Blogs.findByIdAndUpdate({_id : blogPost[0]?._id }, payload).exec().then((result) => {
            res.render('post-login/statusPage', {
                message: 'Updated Successfully',
                backLink: '/editPage'
            });
        }).catch((errorresult) => {
            res.render('post-login/statusPage', {
                message: 'Something went wrong to Update... Please try again',
                backLink: '/editPage'
            });
        })
    }
}
app.get('/users', (req, res) => {
    getAllPosts(req, res);
});
app.get('/users/:id', (req, res) => {
    getAllPosts(req, res);
})
app.get('/', (req, res) => {
    res.redirect('/home');
})
app.get('/home', (req, res) => {
    res.render('pre-login/home');
});

app.post('/home', [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required')
], (req, res) => {
    login(req, res);
});

app.get('/about', (req, res) => {
    res.render('pre-login/about');
})
app.get('/contact', (req, res) => {
    res.render('pre-login/contact');
})
app.get('/team', (req, res) => {
    res.render('pre-login/team');
})

app.get('/dashboard', checkAuthentication, (req, res) => {
    res.render('post-login/dashboard');
})

app.get('/addPage', checkAuthentication, (req, res) => {
    res.render('post-login/addPage');
})

app.get('/sucessAddPage', checkAuthentication, (req, res) => {
    res.render('post-login/statusPage', {
        message: 'You have sucessfully created a new post!',
        backLink: '/editPage'
    });
});

app.post('/addPage',
    checkAuthentication,
    [
        check('pageTitle').trim().notEmpty().withMessage('Title is required').
            bail().
            isLength({ min: 5 }).withMessage('Title should have atleast 5 characters')
    ],
    (req, res) => {
        postBlog(req, res)
    });

app.get('/editPage', checkAuthentication, (req, res) => {
    getAllBlogs(req, res);
})
app.get('/edit/:id', checkAuthentication, (req, res) => {
    getBlogById(req, res);
})

app.post('/edit/:id', checkAuthentication, [
    check('pageTitle').trim().notEmpty().withMessage('Title is required').
        bail().
        isLength({ min: 5 }).withMessage('Title should have atleast 5 characters')
],
    (req, res) => {
        postBlogById(req, res);
    })

app.get('/delete/:id', checkAuthentication, (req, res) => {
    deleteById(req, res);
});

app.get('/logout', (req, res) => {
    isAdmin = null;
    res.redirect('/home');
})
function login(req, res) {
    const errors = validationResult(req).array();
    if (errors.length) {
        res.render('pre-login/home', {
            errors: errors
        });
    } else {
        const users = [{
            username: 'admin@gmail.com',
            password: 'admin',
            isAdmin: true
        },
        {
            username: 'user@gmail.com',
            password: 'user',
            isAdmin: false
        }];
        const payload = req.body;
        const index = users.findIndex((obj) => obj.username === payload.username && obj.password === payload.password);
        if (index !== -1) {
            isAdmin = users[index].isAdmin;
            res.redirect('/dashboard');
        } else {
            res.render('pre-login/home', {
                errors: [{
                    msg: 'No User found'
                }]
            });
        }
    }
}

app.listen(Port, () => {
    console.log('Server is up and running');
})
