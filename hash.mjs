import bcrypt from 'bcryptjs'; const password = 'test123'; bcrypt.genSalt(10).then(salt => bcrypt.hash(password, salt)).then(hash => console.log(hash));
