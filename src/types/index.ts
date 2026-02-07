export interface Journal {
  id: number;
  title: string;
  issn: string;
  category: string;
  rating: number;
  description: string;
  reviews: Review[];
}

export interface Review {
  author: string;
  rating: number;
  content: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export type CategoryMap = {
  [key: string]: string;
};