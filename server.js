// KAAC Symbols Search 서버
// ① 회원가입 랜딩(소셜 버튼 + 이메일/비밀번호 직접입력) -> ② 추가정보 입력 화면
// 소셜 로그인 경로와 직접 이메일 가입 경로는 ②번 화면에서 다르게 보여줘요.

require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

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

// 실제 구글 G 로고 (공식 4색 마크, 인라인 SVG)
const googleLogoSVG = `
<svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.3 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16 4 9.1 8.4 6.3 14.7z"/>
  <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.5 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.1 39.6 16 44 24 44z"/>
  <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.5 36.4 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z"/>
</svg>`;

// 카카오 말풍선 로고 (간단한 흑색 벡터)
const kakaoLogoSVG = `
<svg width="18" height="18" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <path fill="#111" d="M18 4C9.2 4 2 9.9 2 17.2c0 4.7 3 8.8 7.5 11.1-.3 1.1-1.2 4.3-1.4 5-.2.8.3.8.6.6.3-.2 4.5-3 6.3-4.2.9.1 1.9.2 3 .2 8.8 0 16-5.9 16-13.2S26.8 4 18 4z"/>
</svg>`;

// ---------- ① 회원가입 랜딩 화면 ----------
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>KAAC Symbols Search - 회원가입</title>
      <style>
        ${commonStyle}
        .wrap { display:flex; justify-content:center; padding-top:70px; }
        .box { width:330px; text-align:center; }
        .sub-logo { font-size:15px; color:#333; margin-bottom:14px; }
        h1 { font-size:24px; margin:0 0 28px; }
        .social-btn {
          width:100%; padding:12px; border-radius:8px; font-size:14px; font-weight:600;
          margin-bottom:10px; display:flex; align-items:center; justify-content:center; gap:8px;
          cursor:pointer; text-decoration:none; border:none;
        }
        .social-btn svg { flex-shrink:0; }
        .kakao { background:#FEE500; color:#111; }
        .naver { background:#03C75A; color:#fff; }
        .naver .icon-box { width:16px; height:16px; border-radius:3px; background:#fff; color:#03C75A; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center; }
        .google { background:#fff; color:#111; border:1px solid #e5e7eb; }
        .divider { display:flex; align-items:center; gap:10px; margin:20px 0; color:#9ca3af; font-size:13px; }
        .divider::before, .divider::after { content:""; flex:1; height:1px; background:#e5e7eb; }
        input {
          width:100%; padding:12px 14px; border-radius:8px; border:none;
          background:#EEF0FB; margin-bottom:10px; font-size:14px; color:#333;
        }
        .pw-wrap { position:relative; }
        .pw-wrap span { position:absolute; right:14px; top:13px; color:#9ca3af; cursor:pointer; user-select:none; }
        .main-btn {
          width:100%; padding:12px; border-radius:8px; border:none; background:#1D5FE0;
          color:#fff; font-size:14px; font-weight:600; cursor:pointer; margin-top:4px;
        }
        .footer-link { margin-top:20px; font-size:13px; color:#555; }
        .footer-link a { color:#1D5FE0; text-decoration:none; }
        .terms { margin-top:40px; font-size:11px; color:#aaa; }
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
          <h1>회원가입을 진행해주세요</h1>

          <a href="/auth/kakao" class="social-btn kakao">${kakaoLogoSVG} 카카오로 시작하기</a>
          <a href="/auth/naver" class="social-btn naver"><span class="icon-box">N</span> 네이버로 시작하기</a>
          <a href="/auth/google" class="social-btn google">${googleLogoSVG} Google로 시작하기</a>

          <div class="divider">or</div>

          <form action="/signup-info" method="GET">
            <input type="email" id="pw1-email" name="email" placeholder="이메일" required />
            <div class="pw-wrap">
              <input type="password" id="pw1" name="password" placeholder="비밀번호" required />
              <span onclick="togglePw('pw1')">👁</span>
            </div>
            <button type="submit" class="main-btn">계속</button>
          </form>

          <div class="footer-link">이미 계정이 있으신가요? <a href="#">로그인하기</a></div>
          <div class="terms">계속 진행하면 이용 약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.</div>
        </div>
      </div>

      <script>
        function togglePw(id) {
          const input = document.getElementById(id);
          input.type = input.type === "password" ? "text" : "password";
        }
      </script>
    </body>
    </html>
  `);
});

// ---------- ② 추가정보 입력(회원가입) 화면 ----------
app.get("/signup-info", (req, res) => {
  const email = req.query.email || "";
  const password = req.query.password || "";
  const nickname = req.query.nickname || "";
  const provider = req.query.provider || ""; // "kakao" | "naver" | "google" | ""
  const isSocial = Boolean(provider);

  const providerLabel = { kakao: "카카오", naver: "네이버", google: "Google" }[provider] || "";

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
        h1 { font-size:32px; margin:0 0 16px; }
        .social-banner {
          display:inline-flex; align-items:center; gap:8px; background:#EEF2FF; color:#3730A3;
          padding:8px 14px; border-radius:20px; font-size:13px; margin-bottom:26px;
        }
        h2 { font-size:20px; margin:0 0 18px; }
        .field { margin-bottom:22px; }
        .field label { display:block; font-size:15px; margin-bottom:8px; }
        .field input, .field select {
          width:100%; border:none; border-bottom:1px solid #9ca3af; background:transparent;
          padding:6px 2px 10px; font-size:15px; color:#111; outline:none;
        }
        .field input::placeholder { color:#9ca3af; }
        .field input[readonly] { color:#374151; text-decoration:underline; }
        .pw-wrap2 { position:relative; }
        .pw-wrap2 span { position:absolute; right:4px; top:6px; color:#9ca3af; cursor:pointer; user-select:none; }
        .select-wrap { position:relative; }
        .select-wrap::after { content:"⌄"; position:absolute; right:4px; top:0; color:#6b7280; font-size:16px; pointer-events:none; }
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

          ${
            isSocial
              ? `<div class="social-banner">💬 ${providerLabel} 계정(${email})으로 가입 중입니다</div>`
              : ""
          }

          <h2>필수 입력</h2>

          ${
            isSocial
              ? "" // 소셜 로그인이면 이메일/비밀번호 입력란 자체를 아예 안 보여줌
              : `
          <div class="field">
            <label>아이디(이메일 주소)</label>
            <input type="email" value="${email}" readonly placeholder="이메일을 입력해주세요" />
          </div>
          <div class="field pw-wrap2">
            <label>비밀번호</label>
            <input type="password" id="pw2" value="${password}" placeholder="비밀번호를 입력해주세요" />
            <span onclick="togglePw('pw2')">👁</span>
          </div>
          <div class="field pw-wrap2">
            <label>비밀번호 확인</label>
            <input type="password" id="pw3" value="${password}" />
            <span onclick="togglePw('pw3')">👁</span>
          </div>
          `
          }

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

      <script>
        function togglePw(id) {
          const input = document.getElementById(id);
          input.type = input.type === "password" ? "text" : "password";
        }
      </script>
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

// ---------- 카카오 로그인 콜백 ----------
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

    res.redirect(
      `/signup-info?provider=kakao&email=${encodeURIComponent(email)}&nickname=${encodeURIComponent(nickname)}`
    );
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("로그인 처리 중 오류가 발생했어요. 서버 로그를 확인해주세요.");
  }
});

app.listen(PORT, () => {
  console.log(`서버가 실행 중이에요: http://localhost:${PORT}`);
});
