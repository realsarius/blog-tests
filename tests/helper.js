const loginWith = async (page, username, password) => {
    await page.getByRole('button', { name: 'login' }).click();
    await page.getByTestId('username').fill(username);
    await page.getByTestId('password').fill(password);
    await page.getByRole('button', { name: 'login' }).click();
};

const createBlog = async (page, blogTitle, blogAuthor, blogUrl) => {
    await page.getByRole('button', { name: 'add new blog' }).click();
    await page.getByTestId('blog-title').fill(blogTitle);
    await page.getByTestId('blog-author').fill(blogAuthor);
    await page.getByTestId('blog-url').fill(blogUrl);
    await page.getByRole('button', { name: 'Add Blog' }).click();
};

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export { loginWith, createBlog, getRandomInt };