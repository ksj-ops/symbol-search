// KAAC Symbols Search - 카카오 로그인 데모 서버
// 이 파일 하나로 "로그인 버튼 -> 카카오 인증 -> 사용자 정보 표시" 전체 흐름을 처리해요.

require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- 이 세 값은 나중에 Render의 "Environment Variables"에 등록할 거예요 ----
// 지금은 로컬 테스트용으로 .env 파일에서 불러와요 (아래 .env.example 참고)
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI; // 예: https://xxx.onrender.com/auth/kakao/callback

// 1) 첫 화면: 로그인 버튼 하나만 있는 아주 간단한 페이지
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><meta charset="UTF-8"><title>KAAC 카카오 로그인 데모</title></head>
      <body style="font-family: sans-serif; text-align:center; margin-top:80px;">
        <h2>KAAC Symbols Search</h2>
        <p>카카오 로그인 연동 테스트 페이지입니다.</p>
        <a href="/auth/kakao">
          <button style="background:#FEE500; border:none; padding:12px 24px; border-radius:8px; font-size:16px; cursor:pointer;">
            카카오로 로그인
          </button>
        </a>
      </body>
    </html>
  `);
});

// 2) "카카오로 로그인" 버튼을 누르면 이 경로로 오고,
//    여기서 카카오 인증 서버로 사용자를 보내요 (흐름도의 ①→② 단계)
app.get("/auth/kakao", (req, res) => {
  const kakaoAuthURL =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
    `&response_type=code`;

  res.redirect(kakaoAuthURL);
});

// 3) 카카오 로그인이 끝나면, 카카오가 사용자를 다시 이 주소로 돌려보내요.
//    이때 "code"라는 값을 같이 실어서 보내줘요 (흐름도의 ③ 단계)
app.get("/auth/kakao/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("카카오 인증 코드가 없어요. 다시 시도해주세요.");
  }

  try {
    // 4) 받은 code를 가지고, 카카오에 "진짜 로그인 토큰"을 요청해요 (흐름도의 ④ 단계)
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code: code,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 5) 받은 토큰으로 실제 사용자 정보(이름, 이메일 등)를 요청해요 (흐름도의 ⑤ 단계)
    const userResponse = await axios.get(
      "https://kapi.kakao.com/v2/user/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const kakaoAccount = userResponse.data.kakao_account || {};
    const nickname = kakaoAccount.profile?.nickname || "(닉네임 없음)";
    const email = kakaoAccount.email || "(이메일 제공 동의 안 함)";

    // 6) 결과를 화면에 보여줘요 (흐름도의 ⑥ 단계)
    res.send(`
      <html>
        <head><meta charset="UTF-8"><title>로그인 성공</title></head>
        <body style="font-family: sans-serif; text-align:center; margin-top:80px;">
          <h2>카카오 로그인 성공!</h2>
          <p>닉네임: <b>${nickname}</b></p>
          <p>이메일: <b>${email}</b></p>
          <a href="/">처음으로 돌아가기</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("로그인 처리 중 오류가 발생했어요. 서버 로그를 확인해주세요.");
  }
});

app.listen(PORT, () => {
  console.log(`서버가 실행 중이에요: http://localhost:${PORT}`);
});
