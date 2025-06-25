import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../api';
import { FaSearch } from 'react-icons/fa';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'mahasiswa' });
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

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
      setShowAddForm(false);
      fetchUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah pengguna');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user, password: '' });
    setShowAddForm(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser.username) {
      setError('Username harus diisi');
      return;
    }

    try {
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
    <div className="p-4 mt-10 px-12 py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-left px-4 py-2 bg-[#CCDDFB] text-white shadow-md rounded-full inline-block max-w-fit">
          User List
        </h2>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Cari username..."
            className="pl-10 pr-4 py-2 rounded-lg bg-blue-100 text-gray-700 w-full outline-none focus:ring-2 focus:ring-blue-300 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {loading && <div className="loading loading-spinner"></div>}

      {/* Tombol tampilkan form tambah */}
      {!editingUser && !showAddForm && (
        <div className="flex justify-end mb-4">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            Add New User
          </button>
        </div>
      )}

      {/* Form Tambah User */}
      {showAddForm && !editingUser && (
        <div className="relative mb-6 mt-12 p-6 border rounded-lg bg-white shadow text-black">
          <button
            className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
            onClick={() => {
              setShowAddForm(false);
              setNewUser({ username: '', password: '', role: 'mahasiswa' });
              setError('');
            }}
            title="Tutup Form"
          >
            ×
          </button>
          <h3 className="text-lg font-semibold text-black">Add New User</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                type="text"
                placeholder="Username"
                className="input input-bordered bg-blue-100 text-gray-700"
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
                className="input input-bordered bg-blue-100 text-gray-700"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Role</span>
              </label>
              <select
                className="select select-bordered bg-blue-100 text-gray-700"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAddUser} disabled={loading}>
              Add User
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto mt-10">
        <table className="table w-full">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {users
              .filter(user =>
                user.username.toLowerCase().includes(search.toLowerCase())
              )
              .map((user) => (
                <tr key={user.id} className="min-h-[64px] align-middle">
                  <td className="px-3 py-2">{user.id}</td>
                  <td className="px-3 py-2">
                    {editingUser?.id === user.id ? (
                      <input
                        type="text"
                        className="input input-bordered bg-blue-100 text-gray-700 h-10 w-full"
                        value={editingUser.username}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, username: e.target.value })
                        }
                      />
                    ) : (
                      user.username
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editingUser?.id === user.id ? (
                      <select
                        className="select select-bordered bg-blue-100 text-gray-700 h-10 w-full"
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
                  <td className="px-3 py-2">
                    {editingUser?.id === user.id ? (
                      <div className="flex gap-2">
                        <button className="btn btn-success btn-sm" onClick={handleUpdateUser} disabled={loading}>
                          Save
                        </button>
                        <button className="btn btn-error btn-sm" onClick={handleCancelEdit} disabled={loading}>
                          Cancel
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
                          Delete
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
