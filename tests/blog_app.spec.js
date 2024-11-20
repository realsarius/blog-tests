const { test, expect, describe, beforeEach } = require('@playwright/test');
const { loginWith, createBlog, getRandomInt } = require('./helper');

describe('Blog app', () => {

    beforeEach(async ({ page, request }) => {
        await request.post('/api/testing/reset');
        await request.post('/api/users', {
            data: {
                name: 'Berkan Sözer',
                username: 'berkan',
                password: '123456',
            },
        });

        await page.goto('/');
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
        await loginWith(page, username, password);
        await expect(page.getByText(`Logged in as ${name}`)).toBeVisible();
    });

    test('login fails with wrong password', async ({ page }) => {
        await loginWith(page, username, 'wrongpassword');

        const alertErrorDiv = await page.locator('.alert-error');

        await expect(alertErrorDiv).toContainText('invalid username or password');
        await expect(page.getByText(`Logged in as ${name}`)).not.toBeVisible();

        // await expect(alertErrorDiv).toHaveCSS('border-color', 'var(--fallback-er,oklch(var(--er)/0.2))');
        // await expect(page.getByText('invalid username or password')).toBeVisible()
    });

    describe('when logged in', () => {
        beforeEach(async ({ page }) => {
            await loginWith(page, username, password);
            await expect(page.getByText(`Logged in as ${name}`)).toBeVisible();
        });

        describe('a new blog can be created and liked', () => {
            beforeEach(async ({ page }) => {
                const blogTitle = 'My first blog ever';
                const blogAuthor = 'Berkan Sözer';
                const blogUrl = 'https://en.wikipedia.org/wiki/Murder_on_the_Orient_Express';

                const blogTitle2 = 'Think of a Number\n';
                const blogAuthor2 = 'John Verdon\n';
                const blogUrl2 = 'https://en.wikipedia.org/wiki/Think_of_a_Number';

                await createBlog(page, blogTitle, blogAuthor, blogUrl);
                await expect(page.getByText(`a new blog ${blogTitle} by ${blogAuthor} added`)).toBeVisible();

                await page.waitForTimeout(3000);

                await createBlog(page, blogTitle2, blogAuthor2, blogUrl2);
                await expect(page.getByText(`a new blog ${blogTitle2} by ${blogAuthor2} added`)).toBeVisible();
            });

            test('a new blog can be created', async ({ page }) => {
                const blogTitle = 'My New Book: Le Passager';
                const blogAuthor = 'Jean-Christophe Grangé';
                const blogUrl = 'https://fr.wikipedia.org/wiki/Le_Passager_(roman)';

                await createBlog(page, blogTitle, blogAuthor, blogUrl);

                await expect(page.getByText(`a new blog ${blogTitle} by ${blogAuthor} added`)).toBeVisible();
            });

            test('a new created blog can be liked', async ({ page }) => {
                await page.getByRole('button', { name: 'show' }).first().click();
                await expect(page.getByText('likes 0')).toBeVisible();

                await page.getByRole('button', { name: 'like' }).click();
                await page.waitForTimeout(500);
                await page.getByRole('button', { name: 'like' }).click();
                await expect(page.getByText('likes 2')).toBeVisible();
            });

            test('a blog can be deleted', async ({ page }) => {
                page.on('dialog', async (dialog) => {
                    if (dialog.type() === 'confirm') {
                        await dialog.accept();
                    }
                });

                await expect(page.getByText('My first blog ever')).toBeVisible();

                await page.getByRole('button', { name: 'show' }).first().click();
                await page.getByRole('button', { name: 'remove' }).click();

                await page.waitForTimeout(500);

                await expect(page.getByText('My first blog ever')).not.toBeVisible();
            });

            test('only the creator of a blog sees the delete button', async ({ page }) => {
                await page.locator('li').filter({ hasText: 'Think of a Number show' }).getByRole('button');
                await expect(page.getByRole('button', { name: 'remove' })).not.toBeVisible();
            });

        });

        describe('blogs are sorted by likes', () => {
            beforeEach(async ({ page }) => {
                const blogTitle = 'My first blog ever';
                const blogAuthor = 'Berkan Sözer';
                const blogUrl = 'https://en.wikipedia.org/wiki/Murder_on_the_Orient_Express';

                const blogTitle2 = 'Think of a Number';
                const blogAuthor2 = 'John Verdon';
                const blogUrl2 = 'https://en.wikipedia.org/wiki/Think_of_a_Number';

                const blogTitle3 = 'My Third Blog';
                const blogAuthor3 = 'Artificial Intelligence';
                const blogUrl3 = 'https://www.google.com/thirdblog';

                // Create blogs
                await createBlog(page, blogTitle, blogAuthor, blogUrl);
                await expect(page.getByText(`a new blog ${blogTitle} by ${blogAuthor} added`)).toBeVisible();

                await createBlog(page, blogTitle2, blogAuthor2, blogUrl2);
                await expect(page.getByText(`a new blog ${blogTitle2} by ${blogAuthor2} added`)).toBeVisible();


                await createBlog(page, blogTitle3, blogAuthor3, blogUrl3);
                await expect(page.getByText(`a new blog ${blogTitle3} by ${blogAuthor3} added`)).toBeVisible();

                // Add likes to blogs
                const showButtons = await page.getByRole('button', { name: 'show' }).all();
                for (const showButton of showButtons) {
                    await showButton.click();

                    const likeButton = await page.getByRole('button', { name: 'like' });
                    const randomNumber = getRandomInt(1, 20);

                    for (let i = 0; i < randomNumber; i++) {
                        await likeButton.click();

                        await page.waitForTimeout(200);
                    }

                    await page.getByRole('button', { name: 'hide' }).click();

                    await page.waitForTimeout(250);
                }

            });

            test('blogs are displayed in descending order of likes', async ({ page }) => {

                // Reload to get the sorted pages
                await page.reload();
                await page.waitForTimeout(3000);

                const showDetailsButtons = await page.locator('.showDetailsBtn').all();
                for (const showDetailsButton of showDetailsButtons) {
                    await showDetailsButton.click();
                }

                // Likes of all blogs
                const likesElements = await page.locator('text=likes ').all();
                const likes = [];

                for (const element of likesElements) {
                    const text = await element.textContent();
                    const likeCount = parseInt(text.replace('likes ', ''), 10);
                    likes.push(likeCount);
                }

                // Verify the likes are in descending order
                for (let i = 0; i < likes.length - 1; i++) {
                    await expect(likes[i]).toBeGreaterThanOrEqual(likes[i + 1]);
                }
            });

        });
    });
});
