import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import ProductImage from "../common/ProductImage";
import { Button } from "../ui/button";
import photos from "../../data/home-inspiration.json";
import "../../styles/home-photo-discovery.css";

export default function HomePhotoDiscovery() {
  const [viewportRef, carousel] = useEmblaCarousel({ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps" });

  return (
    <section id="home-photo-discovery" className="home-photo-discovery" aria-labelledby="photo-discovery-title" aria-roledescription="carousel">
      <div className="photo-discovery-header">
        <h2 id="photo-discovery-title">Explore more products</h2>
        <Link className="photo-discovery-see-all" to="/products">See all products</Link>
      </div>
      <div className="photo-discovery-rail">
        <div className="photo-discovery-controls">
          <Button variant="outline" size="icon" aria-label="Previous product collections" onClick={() => carousel?.scrollPrev()}><ChevronLeft aria-hidden="true" /></Button>
          <Button variant="outline" size="icon" aria-label="Next product collections" onClick={() => carousel?.scrollNext()}><ChevronRight aria-hidden="true" /></Button>
        </div>
      <div className="photo-discovery-viewport" ref={viewportRef}>
        <div className="photo-discovery-track">
          {photos.map(photo => (
            <Link id={`photo-discovery-${photo.key}`} className="photo-discovery-card" key={photo.key} aria-label={photo.label} to={`/products?search=${encodeURIComponent(photo.search)}`}>
              <div className="photo-discovery-image"><ProductImage src={photo.url} alt={photo.label} loading="lazy" /></div>
              <span className="photo-discovery-caption">{photo.label.replace(/^Shop /, "")}</span>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
