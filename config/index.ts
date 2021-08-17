const dev = process.env.NODE_ENV !== 'production';

const DEV_HOST = 'http://localhost:3000';
const PROD_HOST = 'https://hrtestbott.herokuapp.com';

export const server = dev ? DEV_HOST : PROD_HOST;
