import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Hapus Content-Type default agar FormData bisa ditentukan otomatis
  delete config.headers['Content-Type'];
  return config;
}, (error) => Promise.reject(error));

export const login = (username, password) =>
  api.post('/auth/login', { username, password }, {
    headers: { 'Content-Type': 'application/json' },
  });

export const getBooks = () => api.get('/books/');

export const searchBooks = (title) => api.get(`/books/search?title=${title}`);

export const addBook = (bookData) =>
  api.post('/books/', bookData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const updateBook = (id, bookData) =>
  api.put(`/books/${id}`, bookData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const deleteBook = (id) => api.delete(`/books/${id}`);

export const addUser = (user) => api.post('/users/', user, {
  headers: { 'Content-Type': 'application/json' },
});

export const getUsers = () => api.get('/users/');

export const updateUser = (id, user) => api.put(`/users/${id}`, user, { // Remove trailing slash
  headers: { 'Content-Type': 'application/json' },
});

export const deleteUser = (id) => api.delete(`/users/${id}`); // Remove trailing slash

export const borrowBook = (bookId) => api.post('/borrows/', { book_id: bookId }, {
  headers: { 'Content-Type': 'application/json' },
});

export const getBorrows = () => api.get('/borrows/');

export const getBorrowHistory = () => api.get('/borrows/history');

export const requestReturn = (borrowId) => api.post('/returns/', { borrow_id: borrowId }, {
  headers: { 'Content-Type': 'application/json' },
});

export const confirmReturn = (id) => api.put(`/returns/${id}`, {}, { 
  headers: { 'Content-Type': 'application/json' },
});
