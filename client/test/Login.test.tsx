import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/authService', () => ({
  authService: { login: vi.fn() },
}));

import { authService } from '../services/authService';
import Login from '../components/Login';

const mockedLogin = (authService as any).login as ReturnType<typeof vi.fn>;

describe('<Login />', () => {
  beforeEach(() => { mockedLogin.mockReset(); localStorage.clear(); });

  it('affiche une erreur si les champs sont vides', async () => {
    render(<Login onLogin={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    expect(await screen.findByText(/remplir tous les champs/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('appelle authService.login puis onLogin quand le formulaire est valide', async () => {
    const user = { id: 'u1', firstName: 'Abdoulaye' };
    mockedLogin.mockResolvedValue(user);
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await userEvent.type(screen.getByPlaceholderText(/asega/i), 'asega');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(mockedLogin).toHaveBeenCalledWith({ identifier: 'asega', password: 'password123' });
  });

  it('affiche le message d’erreur renvoyé par l’API', async () => {
    mockedLogin.mockRejectedValue({ response: { data: { message: 'Identifiants incorrects' } } });
    render(<Login onLogin={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/asega/i), 'x');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'y');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    expect(await screen.findByText(/identifiants incorrects/i)).toBeInTheDocument();
  });
});
