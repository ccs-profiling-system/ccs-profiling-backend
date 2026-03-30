export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}

export interface UserResponseDTO {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface ChangePasswordRequestDTO {
  oldPassword: string;
  newPassword: string;
}
