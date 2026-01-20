
import { SignJWT } from 'jose';
import fs from 'fs';

const SECRET = new TextEncoder().encode('7b4f34661e91aeadcfa0584e682bcdd190fc99fd');
const ALG = 'HS256';
const EMAIL = 'chiranjeevi8050@gmail.com';

async function createMagicToken(email) {
    return new SignJWT({ email, jti: 'test-uuid-3003' })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(SECRET);
}

createMagicToken(EMAIL).then(token => {
    const url = `http://localhost:3003/api/auth/verify?token=${token}`;
    fs.writeFileSync('token3003.txt', url);
});
