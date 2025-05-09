import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../index';
import styles from './Dashboard.module.css';
import EditAssetForm from './EditAssetForm';

function AssetView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!id) {
      setError('Invalid asset ID');
      setLoading(false);
      return;
    }

    apiClient.get(`/api/assets/${id}`)
      .then(response => {
        if (!response.data) {
          throw new Error('Asset not found');
        }
        setAsset(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching asset:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          navigate('/login');
          return;
        }
        setError(err.response?.status === 500 ? 'Server error - please try again later' : 'Failed to load asset details.');
        setLoading(false);
      });
  }, [id, navigate]);

  const handleUpdate = async (updatedAsset) => {
    try {
      setAsset(updatedAsset);
      setIsEditing(false);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    }
  };

  const renderActionButtons = () => {
    return (
      <div className={styles.actionButtons}>
        {(userRole === 'Admin' || userRole === 'Technician') && (
          <button 
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            Edit Asset
          </button>
        )}
      </div>
    );
  };

  const fetchAssets = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets?page=${page}&limit=${itemsPerPage}`);
      const data = await response.json();
      setAssets(data.assets);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalItems(data.totalItems);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAssets(page);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!asset) {
    return <div className={styles.error}>Asset not found</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{asset.name}</h1>
          <p className={styles.subtitle}>Asset Details</p>
          {renderActionButtons()}
        </div>
      </header>

      <main className={styles.mainContent}>
        {isEditing ? (
          <EditAssetForm
            asset={asset}
            onClose={() => setIsEditing(false)}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className={styles.assetDetails}>
            <section className={styles.detailCard}>
              <h2>General Information</h2>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <h3>Asset Tag</h3>
                  <p>{asset.assetTag}</p>
                </div>
                <div className={styles.detailItem}>
                  <h3>Category</h3>
                  <p>{asset.category}</p>
                </div>
                <div className={styles.detailItem}>
                  <h3>Status</h3>
                  <p className={`${styles.status} ${styles[asset.status.toLowerCase()]}`}>
                    {asset.status}
                  </p>
                </div>
                {asset.assignedTo && (
                  <div className={styles.detailItem}>
                    <h3>Assigned To</h3>
                    <p>{asset.assignedTo.fullName || asset.assignedTo.username}</p>
                  </div>
                )}
                {asset.location && (
                  <div className={styles.detailItem}>
                    <h3>Location</h3>
                    <p>{asset.location}</p>
                  </div>
                )}
              </div>
            </section>

            {asset.notes && (
              <section className={`${styles.detailCard} ${styles.notes}`}>
                <h2>Notes</h2>
                <p>{asset.notes}</p>
              </section>
            )}
          </div>
        )}
      </main>

      <div className="pagination">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <span>Total items: {totalItems}</span>
      </div>
    </div>
  );
}

export default AssetView;