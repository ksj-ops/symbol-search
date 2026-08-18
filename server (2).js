// KAAC Symbols Search - 카카오 로그인 + 실제 디자인 반영 서버
// 흐름: 로그인 화면(①) -> 카카오 인증 -> 콜백 -> 추가정보 입력 화면(②)로 자동 이동

require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET; // 클라이언트 시크릿을 켜둔 경우에만 사용

// ---------- 공통 스타일 (두 화면이 같은 헤더/폰트를 쓰므로 하나로 묶어둠) ----------
const commonStyle = `
  * { box-sizing: border-box; }
  body { font-family: "Pretendard", -apple-system, sans-serif; margin: 0; background: #F3F4F6; color:#111; }
  .nav {
    background:#fff; padding:14px 32px; display:flex; align-items:center; justify-content:space-between;
    border-bottom:1px solid #e5e7eb;
  }
  .nav-left { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:600; }
  .nav-logo { width:28px; height:28px; border-radius:6px; background:#9CA3AF; }
  .nav-right { display:flex; align-items:center; gap:12px; }
  .login-btn { border:1px solid #d1d5db; background:#fff; padding:8px 18px; border-radius:8px; font-size:14px; cursor:pointer; }
  .avatar { width:32px; height:32px; border-radius:50%; background:#6b7280; display:flex; align-items:center; justify-content:center; color:#fff; }
`;

// ---------- ① 로그인 화면 ----------
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>KAAC Symbols Search - 로그인</title>
      <style>
        ${commonStyle}
        .wrap { display:flex; justify-content:center; padding-top:70px; }
        .box { width:330px; text-align:center; }
        .sub-logo { font-size:15px; color:#333; margin-bottom:14px; }
        h1 { font-size:26px; line-height:1.35; margin:0 0 28px; }
        .social-btn {
          width:100%; padding:13px; border-radius:8px; font-size:15px; font-weight:700;
          margin-bottom:10px; display:flex; align-items:center; justify-content:center; gap:8px;
          cursor:pointer; text-decoration:none; border:none;
        }
        .kakao { background:#FEE500; color:#111; }
        .naver { background:#03C75A; color:#fff; }
        .google { background:#fff; color:#111; border:1px solid #e5e7eb; }
        .icon-box { width:18px; height:18px; border-radius:3px; background:#fff; color:#03C75A; font-weight:800; font-size:12px; display:flex; align-items:center; justify-content:center; }
        .divider { display:flex; align-items:center; gap:10px; margin:22px 0; color:#9ca3af; font-size:13px; }
        .divider::before, .divider::after { content:""; flex:1; height:1px; background:#e5e7eb; }
        input {
          width:100%; padding:13px 14px; border-radius:8px; border:none;
          background:#EEF0FB; margin-bottom:10px; font-size:14px; color:#333;
        }
        .pw-wrap { position:relative; }
        .pw-wrap span { position:absolute; right:14px; top:14px; color:#9ca3af; cursor:pointer; }
        .main-btn {
          width:100%; padding:13px; border-radius:8px; border:none; background:#1D5FE0;
          color:#fff; font-size:15px; font-weight:700; cursor:pointer; margin-top:4px;
        }
        .links { margin-top:16px; font-size:13px; }
        .links a { color:#1D5FE0; text-decoration:none; }
        .sub-link { margin-top:8px; color:#555; }
      </style>
    </head>
    <body>
      <div class="nav">
        <div class="nav-left"><div class="nav-logo"></div>KAAC Symbols Search</div>
        <div class="nav-right"><button class="login-btn">Login</button><div class="avatar">👤</div></div>
      </div>

      <div class="wrap">
        <div class="box">
          <div class="sub-logo">KAAC Symbols Search</div>
          <h1>Symbols Search에 오신 것을<br>환영합니다</h1>

          <a href="/auth/kakao" class="social-btn kakao">💬 카카오 로그인</a>
          <a href="/auth/naver" class="social-btn naver"><span class="icon-box">N</span> 네이버 로그인</a>
          <a href="/auth/google" class="social-btn google">🔵 Google 로그인</a>

          <div class="divider">or</div>

          <input type="email" placeholder="이메일" />
          <div class="pw-wrap">
            <input type="password" placeholder="비밀번호" />
            <span>👁</span>
          </div>
          <button class="main-btn">로그인</button>

          <div class="links"><a href="#">비밀번호를 잊으셨나요?</a></div>
          <div class="links sub-link">아직 계정이 없으신가요? <a href="#">계정 만들기</a></div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ---------- ② 추가정보 입력(회원가입) 화면 ----------
// 카카오 로그인에 성공하면 이 화면으로 넘어오고, 이메일 칸에 카카오 이메일이 미리 채워져 있어요.
app.get("/signup-info", (req, res) => {
  const email = req.query.email || "";
  const nickname = req.query.nickname || "";

  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>KAAC Symbols Search - 회원가입</title>
      <style>
        ${commonStyle}
        .wrap { display:flex; justify-content:center; padding:60px 20px; }
        .box { width:640px; }
        h1 { font-size:32px; margin:0 0 26px; }
        h2 { font-size:20px; margin:0 0 18px; }
        .field { margin-bottom:22px; }
        .field label { display:block; font-size:15px; margin-bottom:8px; }
        .field input, .field select {
          width:100%; border:none; border-bottom:1px solid #9ca3af; background:transparent;
          padding:6px 2px 10px; font-size:15px; color:#111; outline:none;
        }
        .field input::placeholder { color:#9ca3af; }
        .field input[readonly] { color:#374151; text-decoration:underline; }
        .select-wrap { position:relative; }
        .select-wrap::after { content:"⌄"; position:absolute; right:4px; top:0; color:#6b7280; font-size:16px; }
        .select-wrap select { appearance:none; -webkit-appearance:none; }
        .section-gap { height:36px; }
        .submit-btn {
          width:100%; padding:14px; border:none; border-radius:6px; background:#6b7280;
          color:#fff; font-size:16px; font-weight:600; cursor:pointer; margin-top:10px;
        }
        .submit-btn:hover { background:#4b5563; }
      </style>
    </head>
    <body>
      <div class="nav">
        <div class="nav-left"><div class="nav-logo"></div>KAAC Symbols Search</div>
        <div class="nav-right"><button class="login-btn">Login</button><div class="avatar">👤</div></div>
      </div>

      <div class="wrap">
        <div class="box">
          <h1>회원가입</h1>
          <h2>필수 입력</h2>

          <div class="field">
            <label>아이디(이메일 주소)</label>
            <input type="email" value="${email}" ${email ? "readonly" : ""} placeholder="이메일을 입력해주세요" />
          </div>
          <div class="field">
            <label>비밀번호</label>
            <input type="password" placeholder="${email ? "소셜 로그인은 비밀번호가 필요 없어요" : "비밀번호를 입력해주세요"}" ${email ? "disabled" : ""} />
          </div>
          <div class="field">
            <label>비밀번호 확인</label>
            <input type="password" ${email ? "disabled" : ""} />
          </div>
          <div class="field">
            <label>이름</label>
            <input type="text" value="${nickname}" placeholder="이름을 입력해주세요" />
          </div>
          <div class="field select-wrap">
            <label>유형</label>
            <select>
              <option value="" selected disabled>유형선택</option>
              <option value="parent">보호자</option>
              <option value="therapist">치료사</option>
              <option value="teacher">교사</option>
              <option value="etc">기타</option>
            </select>
          </div>

          <div class="section-gap"></div>
          <h2>선택 입력</h2>

          <div class="field"><label>전화번호</label><input type="text" placeholder="전화번호를 입력해주세요" /></div>
          <div class="field"><label>기관</label><input type="text" placeholder="소속 기관을 입력해주세요" /></div>
          <div class="field"><label>주소</label><input type="text" placeholder="주소를 입력해주세요" /></div>
          <div class="field"><label>직위</label><input type="text" placeholder="직위를 입력해주세요" /></div>
          <div class="field"><label>생일</label><input type="text" placeholder="년-월-일" /></div>

          <button class="submit-btn">가입하기</button>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ---------- 카카오 로그인 시작 ----------
app.get("/auth/kakao", (req, res) => {
  const kakaoAuthURL =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
    `&response_type=code`;

  res.redirect(kakaoAuthURL);
});

// ---------- 카카오 로그인 콜백: 성공하면 ②(추가정보 입력)로 자동 이동 ----------
app.get("/auth/kakao/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("카카오 인증 코드가 없어요. 다시 시도해주세요.");
  }

  try {
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code: code,
          client_secret: KAKAO_CLIENT_SECRET,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoAccount = userResponse.data.kakao_account || {};
    const nickname = kakaoAccount.profile?.nickname || "";
    const email = kakaoAccount.email || "";

    // 여기가 핵심: ②번 화면(추가정보 입력)으로 자동 이동시키면서,
    // 카카오에서 받은 이메일/닉네임을 그 화면에 미리 채워줘요.
    res.redirect(
      `/signup-info?email=${encodeURIComponent(email)}&nickname=${encodeURIComponent(nickname)}`
    );
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("로그인 처리 중 오류가 발생했어요. 서버 로그를 확인해주세요.");
  }
});

app.listen(PORT, () => {
  console.log(`서버가 실행 중이에요: http://localhost:${PORT}`);
});
