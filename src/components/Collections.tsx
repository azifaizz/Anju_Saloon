import AnimatedSection from "./AnimatedSection";
import cottonSareesImage from "@/assets/cotton-sarees.jpg";
import dressMaterialsImage from "@/assets/dress-materials.jpg";

const Collections = () => {
  const collections = [

    {
      title: "Salon Services",
      image: cottonSareesImage, // Note: keeping same image ref to avoid missing files
      description: "Experience premium hair styling, facial treatments, and relaxing spa services.",
    },
    {
      title: "Cosmetics Retail",
      image: dressMaterialsImage, // Note: keeping same image ref to avoid missing files
      description: "Discover a curated range of high-quality cosmetics and beauty products.",
    },
  ];

  return (
    <AnimatedSection id="collections">
      <div className="container mx-auto px-4">
        <div className="animated-border-advanced p-8 md:p-12 bg-white/50 backdrop-blur-xl rounded-2xl shadow-elegant">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900">
              Our <span className="text-gradient-salon">Collections</span>
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore our carefully curated selection of professional salon services and
              premium cosmetics.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              // --- THIS IS THE MODIFIED PART ---
              <div
                key={collection.title}
                className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden group transition-shadow duration-300 hover:shadow-dramatic border border-white/50"
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h3 className="absolute bottom-4 left-4 text-3xl font-serif font-bold text-white drop-shadow-lg">
                    {collection.title}
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{collection.description}</p>
                  <a
                    href="#contact"
                    className="font-bold text-gradient-salon hover:opacity-80 transition-opacity"
                  >
                    Enquire Now →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};
export default Collections;
