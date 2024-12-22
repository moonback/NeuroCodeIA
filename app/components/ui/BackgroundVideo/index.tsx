import styles from './styles.module.scss';

const BackgroundVideo = () => {
  return (
    <div className={styles.videoContainer}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className={styles.video}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default BackgroundVideo; 