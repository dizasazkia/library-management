import { useContext, useEffect, useState } from 'react';
import { getBooks, getBookRating } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [latestBooks, setLatestBooks] = useState([]);

  useEffect(() => {
    if (user?.role === 'mahasiswa') {
      getBooks()
        .then(res => {
          setBooks(res.data);

          // 5 buku terbaru (urut dari id terbesar)
          const latest = [...res.data]
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);
          setLatestBooks(latest);

          // Ambil rating untuk setiap buku
          const fetchRatings = async () => {
            const ratings = {};
            await Promise.all(
              res.data.map(async (book) => {
                try {
                  const ratingRes = await getBookRating(book.id);
                  ratings[book.id] = ratingRes.data.avg_rating;
                } catch {
                  ratings[book.id] = null;
                }
              })
            );
            // Top books
            const top = [...res.data]
              .map(book => ({ ...book, avg_rating: ratings[book.id] }))
              .filter(b => b.avg_rating !== undefined)
              .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
              .slice(0, 5);
            setTopBooks(top);

            // Latest books with rating
            const latestWithRating = latest.map(book => ({
              ...book,
              avg_rating: ratings[book.id]
            }));
            setLatestBooks(latestWithRating);
          };

          fetchRatings();
        })
        .catch(err => {
          console.error('Fetch error:', err);
        });
    }
  }, [user]);

  return (
      <div className="hero min-h-screen bg-white">
        <div className="hero-content text-center flex flex-col w-full max-w-none px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="w-full bg-[#b1c3e1] p-10 rounded-2xl mb-4 mt-14">
            <div className="flex flex-col md:flex-row items-center justify-between w-full">
              <div className="text-left mb-6 md:mb-0 md:w-2/3">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Welcome to the Library System
                </h1>
                    <p className="text-white text-base md:text-2xl">
                      {user?.role === 'admin'
                        ? 'Manage books, users, and transactions efficiently.'
                        : 'Explore a books and manage your reading history with ease.'}
                    </p>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <img
                  src="/hero.png" 
                  alt="Library Decoration"
                  className="rounded-lg object-contain mr-6"
                  style={{ width: '100%', maxWidth: 400, maxHeight: 300, height: 'auto' }}
                />
              </div>
            </div>
          </div>
        {user?.role === 'mahasiswa' && (
          <div className="w-full mt-8">
            <div className="mb-8">
              <div className="text-left">
                <h2 className="text-lg font-bold text-left px-4 py-2 bg-[#CCDDFB] text-white shadow-md rounded-full inline-block max-w-fit ml-0 mb-10">Popular Collection</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                {topBooks.map(book => (
                  <Link to={`/books/${book.id}`} key={book.id} className="flex flex-col">
                    <img src={`http://localhost:5000${book.image}`} alt={book.title} className="rounded-lg object-cover mb-2" style={{ width: 150, height: 225 }} />
                    <div className="font-semibold text-black text-left">{book.title}</div>
                    <div className="text-sm text-gray-600 text-left">{book.author}</div>
                    <div className="text-yellow-400 text-left">
                      {'★'.repeat(Math.round(book.avg_rating || 0))}
                      {'☆'.repeat(5 - Math.round(book.avg_rating || 0))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-left px-4 py-2 mt-4 bg-[#CCDDFB] text-white  shadow-md rounded-full inline-block max-w-fit mb-10">Latest Collection</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                {latestBooks.map(book => (
                  <Link to={`/books/${book.id}`} key={book.id} className="flex flex-col">
                    <img src={`http://localhost:5000${book.image}`} alt={book.title} className="rounded-lg object-cover mb-2" style={{ width: 150, height: 225 }} />
                    <div className="font-semibold text-black text-left">{book.title}</div>
                    <div className="text-sm text-gray-600 text-left">{book.author}</div>
                    <div className="text-yellow-400 text-left">
                      {'★'.repeat(Math.round(book.avg_rating || 0))}
                      {'☆'.repeat(5 - Math.round(book.avg_rating || 0))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;