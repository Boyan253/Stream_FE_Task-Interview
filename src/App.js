import React, { useState } from 'react';
import axios from 'axios';
import { Button, Upload, List, message, Space, Typography, Spin, Modal } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import './TMDBMovieUploader.css';

const { Title, Text } = Typography;

const TMDB_API_KEY = '4e87c8c0234c83f5b845585ead3f56a5';

function TMDBMovieUploader() {
  const [fileContent, setFileContent] = useState([]);
  const [movieData, setMovieData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result.split('\n').filter(Boolean).map(title => title.trim());
      setFileContent(content);
    };
    reader.readAsText(file);
    return false;
  };

  const fetchMovieData = async () => {
    if (!fileContent.length) {
      message.warning('Please upload a file with movie titles.');
      return;
    }

    setIsSearching(true);

    try {
      const fetchedData = await Promise.all(
        fileContent.map(async (title) => {
          try {
            const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
              params: { api_key: TMDB_API_KEY, query: title }
            });
            const movie = response.data.results[0];
            if (movie) {
              const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
                params: { api_key: TMDB_API_KEY, append_to_response: 'credits,videos' }
              });
              return {
                id: detailsResponse.data.id,
                title: detailsResponse.data.title,
                overview: detailsResponse.data.overview,
                actors: detailsResponse.data.credits?.cast.slice(0, 5).map(actor => actor.name) || [],
                genres: detailsResponse.data.genres.map(genre => genre.name),
                poster: detailsResponse.data.poster_path ? `https://image.tmdb.org/t/p/w500${detailsResponse.data.poster_path}` : '',
                release: detailsResponse.data.release_date,
                rating: detailsResponse.data.vote_average,
                trailer: detailsResponse.data.videos?.results.find(video => video.type === 'Trailer')?.key,
                director: detailsResponse.data.credits?.crew.find(person => person.job === 'Director')?.name,
                duration: detailsResponse.data.runtime
              };
            }
          } catch (error) {
            console.error(`Error fetching data for "${title}":`, error);
            message.error(`Error fetching data for "${title}"`);
            return null;
          }
        })
      );

      setMovieData(fetchedData.filter(Boolean));
    } catch (error) {
      console.error('Error during data fetch process:', error);
      message.error('An error occurred while fetching movie data.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveMovie = (id) => {
    setMovieData(prevData => prevData.filter(movie => movie.id !== id));
    message.success('Movie removed successfully.');
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };
  const handleSaveData = async () => {
    if (!movieData.length) {
      message.warning('No movie data to save.');
      return;
    }

    try {
      const response = await axios.post('https://dummyendpoint.com/save', movieData, { timeout: 5000 })
      message.success('Data saved successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error saving data:', error);
      if (error.response) {
        message.error(`Error saving data: ${error.response.data.message || 'Please try again.'}`);
      } else if (error.request) {
        message.error('No response from the server. Please check your connection.');
      } else {
        message.error('An unexpected error occurred. Please try again.');
      }
    }
  };
  return (
    <div className="tmdb-uploader-container">
      <Title level={2} style={{ textAlign: 'center' }}>TMDB Movie Uploader</Title>

      <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".txt">
        <Button icon={<UploadOutlined />} type="primary">Upload .txt File</Button>
      </Upload>

      {fileContent.length > 0 && (
        <>
          <Title level={3} style={{ marginTop: '20px' }}>Movie Titles</Title>
          <List
            bordered
            dataSource={fileContent}
            renderItem={(title) => (<List.Item>{title}</List.Item>)}
          />
          <Button
            type="primary"
            onClick={isSearching ? null : (movieData.length > 0 ? handleSaveData : fetchMovieData)}
            loading={isSearching}
            style={{ marginTop: '20px' }}
            block
          >
            {isSearching ? 'Searching...' : movieData.length > 0 ? 'Save Data' : 'Search Movies'}
          </Button>
        </>
      )}

      {isSearching && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Spin size="large" />
        </div>
      )}

      {movieData.length > 0 && (
        <>
          <Title level={3} style={{ marginTop: '20px' }}>Movie Library</Title>
          <div className="movie-library">
            {movieData.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => handleMovieClick(movie)}
              >
                <img src={movie.poster} alt={movie.title} className="movie-poster" />
                <Text strong className="movie-title">{movie.title}</Text>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal visible={!!selectedMovie} onCancel={handleCloseModal} footer={null}>
        {selectedMovie && (
          <>
            <img src={selectedMovie.poster} alt={selectedMovie.title} className="movie-poster" />
            <Title level={4}>{selectedMovie.title}</Title>
            <p><strong>TMDB ID:</strong> {selectedMovie.id}</p>
            <p><strong>Overview:</strong> {selectedMovie.overview}</p>
            <p><strong>Actors:</strong> {selectedMovie.actors.join(', ')}</p>
            <p><strong>Genres:</strong> {selectedMovie.genres.join(', ')}</p>
            <p><strong>Release:</strong> {selectedMovie.release}</p>
            <p><strong>Rating:</strong> {selectedMovie.rating}</p>
            <p><strong>Director:</strong> {selectedMovie.director}</p>
            <p><strong>Duration:</strong> {selectedMovie.duration} mins</p>
          </>
        )}
      </Modal>
    </div>
  );
}

export default TMDBMovieUploader;
