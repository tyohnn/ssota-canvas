import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Dev 모드에서는 Mixpanel을 비활성화
const isEnabled = () => IS_PRODUCTION && !!MIXPANEL_TOKEN;

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing! Check your .env file.');
    return;
  }

  if (!IS_PRODUCTION) {
    console.info('Mixpanel is disabled in development mode');
    return;
  }

  mixpanel.init(MIXPANEL_TOKEN, {
    // Autocapture: 클릭, 폼 제출, 페이지뷰 등을 자동으로 추적
    autocapture: true,
    // Session Replay: 모든 세션 녹화 (production만)
    record_sessions_percent: 100,
    // Persistence: localStorage 대신 cookie 사용 (mutex 에러 방지)
    persistence: 'cookie',
    // Cookie 만료: 1년
    cookie_expiration: 365,
    // 크로스 서브도메인 트래킹
    cross_subdomain_cookie: true,
    // 보안 쿠키 (HTTPS)
    secure_cookie: true,
  });
};

export const identifyUser = (
  userId: string,
  userProperties?: Record<string, any>
) => {
  if (!isEnabled()) return;

  mixpanel.identify(userId);

  if (userProperties) {
    mixpanel.people.set(userProperties);
  }
};

export const resetUser = () => {
  if (!isEnabled()) return;

  mixpanel.reset();
};

export { mixpanel };
