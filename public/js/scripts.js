document.addEventListener('DOMContentLoaded', function() {
    const blogList = document.getElementById('blog-list');
    
    fetch('data/posts.json')
        .then(response => response.json())
        .then(posts => {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                                
                // manipulate postElement to show the content of the blog post with the specific style defined for it
                postElement.className = 'blog-post';
                postElement.innerHTML = `
                    <h2 class="post-title">${post.title}</h2>
                    <div class="post-meta">
                        <i class="fa-solid fa-calendar"></i> <span class="space"></span>
                        <time>${new Date(post.date).toLocaleDateString()}</time>
                    </div>
                    <div class="post-content">${post.content}</div>
                `;
                
                //add postElement as a child to blog list
                blogList.appendChild(postElement);
            });
        })
        .catch(error => console.error('Error loading blog posts:', error));
});