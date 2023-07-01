const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// MongoDB 연결 URL
const mongoDBUrl = 'mongodb+srv://Gaon:J6Ao1Kr5Ywmyy70Z@cluster0.pmqplj9.mongodb.net/?retryWrites=true&w=majority';

// MongoDB에 연결
mongoose.connect(mongoDBUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// 사용자 정보를 담을 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

app.use(express.json());

// 로그인 라우트
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 사용자 정보 조회
    const user = await User.findOne({ username });

    // 사용자가 존재하지 않거나 비밀번호가 일치하지 않을 경우
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 토큰 생성
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, secretKey, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 인증이 필요한 라우트 예시
app.get('/protected_route', authenticateToken, (req, res) => {
  // 인증된 사용자 정보를 사용하여 작업 수행
  const userId = req.user.id;
  res.json({ message: `Protected route for user with ID ${userId}` });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
