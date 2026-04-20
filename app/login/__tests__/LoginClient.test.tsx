import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginClient } from '../_components/LoginClient';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockLogin = vi.fn().mockResolvedValue({ success: false });
vi.mock('@/providers', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const mockGetTokenSilently = vi.fn();
const mockGetUser = vi.fn();
vi.mock('@/lib/auth0-client', () => ({
  getAuth0Client: () =>
    Promise.resolve({
      getTokenSilently: mockGetTokenSilently,
      getUser: mockGetUser,
    }),
}));

vi.mock('@/app/actions/auth', () => ({
  ssoCallbackAction: vi.fn().mockResolvedValue({ success: false }),
  checkUserExistsAction: vi.fn().mockResolvedValue(false),
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

const defaultProps = {
  redirectUrl: '/home',
  showPasswordLogin: true,
  showSsoLogin: true,
  showSignupLink: true,
  attemptSilentLogin: false,
};

/* ------------------------------------------------------------------ */
/*  Rendering flags                                                    */
/* ------------------------------------------------------------------ */

describe('LoginClient — rendering', () => {
  it('renders password form and SSO button when both flags are true', () => {
    render(<LoginClient {...defaultProps} />);

    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with sso/i })).toBeInTheDocument();
  });

  it('renders only the password form when showSsoLogin=false', () => {
    render(<LoginClient {...defaultProps} showSsoLogin={false} />);

    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in with sso/i })).not.toBeInTheDocument();
  });

  it('renders only the SSO button when showPasswordLogin=false', () => {
    render(<LoginClient {...defaultProps} showPasswordLogin={false} />);

    expect(screen.queryByLabelText('Username or email')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with sso/i })).toBeInTheDocument();
  });

  it('hides "Sign up" link when showSignupLink=false', () => {
    render(<LoginClient {...defaultProps} showSignupLink={false} />);

    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Silent SSO with timeout                                            */
/* ------------------------------------------------------------------ */

describe('LoginClient — silent SSO', () => {
  it('shows the form immediately (no spinner) even during silent login', () => {
    mockGetTokenSilently.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginClient {...defaultProps} attemptSilentLogin={true} />);

    expect(screen.getByText(/checking for existing session/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
  });

  it('removes the banner after timeout when silent login hangs', async () => {
    mockGetTokenSilently.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginClient {...defaultProps} attemptSilentLogin={true} />);

    expect(screen.getByText(/checking for existing session/i)).toBeInTheDocument();

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText(/checking for existing session/i)).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
  });

  it('does not show the banner when attemptSilentLogin=false', () => {
    render(<LoginClient {...defaultProps} attemptSilentLogin={false} />);

    expect(screen.queryByText(/checking for existing session/i)).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Login form submission                                              */
/* ------------------------------------------------------------------ */

describe('LoginClient — form submission', () => {
  it('calls login and redirects on success', async () => {
    vi.useRealTimers();
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginClient {...defaultProps} attemptSilentLogin={false} />);

    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/home');
    });
  });
});
