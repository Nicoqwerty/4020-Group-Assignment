function loadBlogPosts() {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;  // Only run on blog page

    fetch('data/posts.json')
        .then(response => response.json())
        .then(posts => {
            blogList.innerHTML = ""; // Clear previous posts

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'blog-post';
                postElement.innerHTML = `
                    <h2 class="post-title">${post.title}</h2>
                    <div class="post-meta">
                        <i class="fa-solid fa-calendar"></i>
                        <span class="space"></span>
                        <time>${new Date(post.date).toLocaleDateString()}</time>
                    </div>
                    <div class="post-content">${post.content}</div>
                `;
                blogList.appendChild(postElement);
            });
        })
        .catch(error => console.error('Error loading blog posts:', error));
}
