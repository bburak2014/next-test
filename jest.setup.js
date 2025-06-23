// jest.setup.js
import "@testing-library/jest-dom";
import "whatwg-fetch";
import { server } from "./__mocks__/server";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

process.env.NEXTAUTH_SECRET = "test-secret";
process.env.AUTH0_CLIENT_ID = "test-client-id";
process.env.AUTH0_CLIENT_SECRET = "test-client-secret";
process.env.AUTH0_ISSUER_BASE_URL = "https://test.auth0.com";
process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID = "test-client-id";
process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL = "https://test.auth0.com";

beforeAll(() => {
  server.listen({
    onUnhandledRequest: "warn",
  });
});

afterEach(() => {
  server.resetHandlers();

  jest.clearAllMocks();
});

afterAll(() => {
  server.close();
});
