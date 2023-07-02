const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const port = 5500;

app.use(express.json());
app.use(cors()); // 모든 도메인에서의 요청 허용

// MongoDB 연결 URL
const mongoDBUrl = 'mongodb+srv://Gaon:J6Ao1Kr5Ywmyy70Z@cluster0.pmqplj9.mongodb.net/?retryWrites=true&w=majority';

// MongoDB에 연결
mongoose.connect(mongoDBUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');
  })
  .catch((error) => {
    console.error('MongoDB 연결 오류:', error);
  });

// 사용자 정보를 담을 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date,
});

const User = mongoose.model('User', userSchema);

app.use(express.json());

// 비밀 키 생성 함수
function generateRandomKey(length) {
  return crypto.randomBytes(length).toString('hex');
}

// JWT 비밀 키 생성 (32바이트 길이의 랜덤 비밀 키)
const secretKey = generateRandomKey(32);

// 회원가입 라우트
app.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // 사용자가 이미 존재하는지 확인
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 사용자 이름 또는 이메일입니다.' });
    }

    // 비밀번호 해싱하여 저장
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새로운 사용자 생성
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();

    res.json({ message: '회원가입이 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 로그인 라우트
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 사용자 정보 조회
    const user = await User.findOne({ username });

    // 사용자가 존재하지 않거나 비밀번호가 일치하지 않을 경우
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: '잘못된 인증 정보입니다.' });
    }

    // 토큰 생성
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, secretKey, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 비밀번호 찾기 라우트
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // 사용자 정보 조회
    const user = await User.findOne({ email });

    // 사용자가 존재하지 않을 경우
    if (!user) {
      return res.status(400).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 재설정 토큰 생성 및 저장
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1시간 후에 토큰 만료

    // 데이터베이스에 변경된 비밀번호 재설정 토큰 정보 저장
    await user.save();

    // 비밀번호 재설정 이메일 전송
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'hongjunportfolio@gmail.com', // 이메일 계정
        pass: 'qwerasdf1122', // 이메일 계정 비밀번호
      },
    });

    const mailOptions = {
      from: 'hongjunportfolio@gmail.com', // 이메일 계정
      to: user.email,
      subject: '비밀번호 초기화 Password Reset',
      text: `아래의 링크를 클릭하여 비밀번호를 초기화 하십시오.\nClick on the link below to reset your password:\n\nhttp://localhost:5500/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: '이메일 전송에 실패하였습니다. \nFailed to send email' });
      } else {
        console.log('이메일이 전송되었습니다:', info.response);
        res.json({ message: '이메일이 성공적으로 전송되었습니다. \nPassword reset email sent successfully' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 비밀번호 재설정 라우트
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // 토큰에 해당하는 사용자 정보 조회
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });

    // 사용자가 존재하지 않거나 토큰이 만료된 경우
    if (!user) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
    }

    // 비밀번호 해싱하여 저장
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 비밀번호 업데이트
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    // 데이터베이스에 변경된 사용자 정보 저장
    await user.save();

    res.json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}/ 에서 실행 중입니다.`);
});
