import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'mahasiswa' });
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setError('Data pengguna tidak valid');
        setUsers([]);
      }
    } catch (err) {
      setError('Gagal mengambil data pengguna');
      console.error("Error fetching users:", err);
      setUsers([]);
    }
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError('Username dan password harus diisi');
      return;
    }

    try {
      await addUser(newUser);
      setNewUser({ username: '', password: '', role: 'mahasiswa' });
      fetchUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah pengguna');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user, password: '' }); // Initialize with empty password
  };

  const handleUpdateUser = async () => {
    if (!editingUser.username) {
      setError('Username harus diisi');
      return;
    }

    try {
      // Only include password if it's provided
      const updateData = {
        username: editingUser.username,
        role: editingUser.role,
        ...(editingUser.password && { password: editingUser.password })
      };

      await updateUser(editingUser.id, updateData);
      setEditingUser(null);
      fetchUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui pengguna');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setError('');
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      fetchUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kelola Pengguna</h2>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      {loading && <div className="loading loading-spinner"></div>}
      
      {/* Add User Form */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Tambah Pengguna Baru</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input
              type="text"
              placeholder="Username"
              className="input input-bordered"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Role</span>
            </label>
            <select
              className="select select-bordered"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="mahasiswa">Mahasiswa</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleAddUser}
            disabled={loading}
          >
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {editingUser?.id === user.id ? (
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={editingUser.username}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, username: e.target.value })
                      }
                    />
                  ) : (
                    user.username
                  )}
                </td>
                <td>
                  {editingUser?.id === user.id ? (
                    <select
                      className="select select-bordered select-sm"
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                    >
                      <option value="mahasiswa">Mahasiswa</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td>
                  {editingUser?.id === user.id ? (
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={handleUpdateUser}
                        disabled={loading}
                      >
                        Simpan
                      </button>
                      <button 
                        className="btn btn-error btn-sm"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEditClick(user)}
                        disabled={loading || editingUser !== null}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading || editingUser !== null}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;