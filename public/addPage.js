const quill = new Quill('#editor', {
    modules: {
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['link', 'blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
        ],
    },
    placeholder: 'Compose an epic...',
    theme: 'snow', // or 'bubble'
});

function updateInputValue() {
    const quillEditorInput = document.getElementById('quillEditorInput');
    quillEditorInput.value = quill.root.innerHTML;
}


function fileChangeEvent(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
      document.getElementById('heroImage').value = reader.result;
    }
    reader.readAsDataURL(file);
}

function postBlog(req, res) {
    const post=req.body.post;
    
    let errors = validationResult(req).array();

    if(post=='<p><br></p>'){
        errors.push({
            msg:'Post content is required'
        });
    }    
    if (errors) {
        res.render('post-login/addPage', {
            errors: errors
        })
    }
}