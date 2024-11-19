const { test, expect, describe, beforeEach } = require('@playwright/test');

describe('Blog app', () => {

    beforeEach(async ({ page, request }) => {
        await request.post('http://localhost:3003/api/testing/reset');
        await request.post('http://localhost:3003/api/users', {
            data: {
                name: 'Matti Luukkainen',
                username: 'mluukkai',
                password: 'salainen',
            },
        });

        await page.goto('http://localhost:5173');
    });

    const username = 'berkan';
    const name = 'Berkan Sözer';
    const password = '123456';

    test('front page can be opened', async ({ page }) => {
        const locator = await page.getByText('Blogs');
        await expect(locator).toBeVisible();
        await expect(page.getByText(`Blog app, Berkan Sözer ${new Date().getFullYear()}`)).toBeVisible();
    });

    test('login form can be opened', async ({ page }) => {
        await page.getByRole('button', { name: 'login' }).click();
        await page.getByTestId('username').fill(username);
        await page.getByTestId('password').fill(password);
        await page.getByRole('button', { name: 'login' }).click();

        await expect(page.getByText(`${name} logged in`)).toBeVisible();
    });

    describe('when logged in', () => {
        beforeEach(async ({ page }) => {
            await page.getByRole('button', { name: 'login' }).click();
            await page.getByTestId('username').fill(username);
            await page.getByTestId('password').fill(password);
            await page.getByRole('button', { name: 'login' }).click();
            await page.waitForTimeout(3000);
        });

        test('a new note can be created', async ({ page }) => {
            const blogTitle = 'My New Book: Le Passager';
            const blogAuthor = 'Jean-Christophe Grangé';
            const blogUrl = 'https://fr.wikipedia.org/wiki/Le_Passager_(roman)';

            await page.getByRole('button', { name: 'add new blog' }).click();
            await page.getByTestId('blog-title').fill(blogTitle);
            await page.getByTestId('blog-author').fill(blogAuthor);
            await page.getByTestId('blog-url').fill(blogUrl);
            // a new blog new title by Berkan Sözer added
            await page.getByRole('button', { name: 'Add Blog' }).click();
            await expect(page.getByText(`a new blog ${blogTitle} by ${blogAuthor} added`)).toBeVisible();
        });
    });
});