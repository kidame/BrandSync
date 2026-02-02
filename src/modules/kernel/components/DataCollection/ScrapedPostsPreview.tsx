import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface InstagramPost {
  id?: string;
  shortCode?: string;
  caption?: string;
  displayUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  timestamp?: string;
  ownerUsername?: string;
  hashtags?: string[];
  images?: string[];
  type?: string;
}

interface ScrapedPostsPreviewProps {
  posts: InstagramPost[];
  jobId: string;
  source: string;
}

export function ScrapedPostsPreview({ posts, jobId, source }: ScrapedPostsPreviewProps) {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!posts || posts.length === 0) {
    return null;
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const getPostImage = (post: InstagramPost): string | null => {
    return post.displayUrl || post.thumbnailUrl || (post.images && post.images[0]) || null;
  };

  const formatCaption = (caption?: string, maxLength = 100): string => {
    if (!caption) return "Pas de légende";
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + "...";
  };

  const handleImageError = (postId: string) => {
    setImageError((prev) => new Set(prev).add(postId));
  };

  const handlePostClick = (post: InstagramPost) => {
    setSelectedPost(post);
    setCurrentImageIndex(0);
  };

  const getPostImages = (post: InstagramPost): string[] => {
    const images: string[] = [];
    if (post.displayUrl) images.push(post.displayUrl);
    if (post.thumbnailUrl && post.thumbnailUrl !== post.displayUrl) {
      images.push(post.thumbnailUrl);
    }
    if (post.images) {
      post.images.forEach((img) => {
        if (!images.includes(img)) images.push(img);
      });
    }
    return images;
  };

  return (
    <>
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Aperçu des posts ({posts.length})
          </h4>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={scrollLeft}
              aria-label="Défiler vers la gauche"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={scrollRight}
              aria-label="Défiler vers la droite"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto -mx-4 px-4 pb-2"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
            {posts.slice(0, 10).map((post, index) => {
              const postId = post.id || post.shortCode || `post-${index}`;
              const imageUrl = getPostImage(post);
              const hasError = imageError.has(postId);

              return (
                <div
                  key={postId}
                  className="flex-shrink-0 w-[180px] cursor-pointer group"
                  onClick={() => handlePostClick(post)}
                >
                  <Card className="overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
                    <AspectRatio ratio={1}>
                      {imageUrl && !hasError ? (
                        <img
                          src={imageUrl}
                          alt={post.caption?.substring(0, 50) || "Post Instagram"}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={() => handleImageError(postId)}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      {post.type === "Video" && (
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white text-xs">
                          Vidéo
                        </Badge>
                      )}
                    </AspectRatio>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {formatCaption(post.caption, 60)}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {post.likesCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likesCount.toLocaleString("fr-CH")}
                          </span>
                        )}
                        {post.commentsCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.commentsCount.toLocaleString("fr-CH")}
                          </span>
                        )}
                      </div>
                      {post.ownerUsername && (
                        <p className="text-xs text-primary mt-1 truncate">
                          @{post.ownerUsername}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
            {posts.length > 10 && (
              <div className="flex-shrink-0 w-[180px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-2xl font-bold">+{posts.length - 10}</p>
                  <p className="text-xs">autres posts</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPost?.ownerUsername && (
                <span className="text-primary">@{selectedPost.ownerUsername}</span>
              )}
              {selectedPost?.type === "Video" && (
                <Badge variant="secondary">Vidéo</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Image carousel */}
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <AspectRatio ratio={1}>
                  {getPostImages(selectedPost).length > 0 ? (
                    <img
                      src={getPostImages(selectedPost)[currentImageIndex]}
                      alt={selectedPost.caption?.substring(0, 50) || "Post"}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </AspectRatio>
                
                {getPostImages(selectedPost).length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === 0 ? getPostImages(selectedPost).length - 1 : prev - 1
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === getPostImages(selectedPost).length - 1 ? 0 : prev + 1
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {getPostImages(selectedPost).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentImageIndex ? "bg-primary" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                {selectedPost.likesCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{selectedPost.likesCount.toLocaleString("fr-CH")}</span>
                    <span className="text-muted-foreground">likes</span>
                  </span>
                )}
                {selectedPost.commentsCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{selectedPost.commentsCount.toLocaleString("fr-CH")}</span>
                    <span className="text-muted-foreground">commentaires</span>
                  </span>
                )}
                {selectedPost.videoViewCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{selectedPost.videoViewCount.toLocaleString("fr-CH")}</span>
                    <span className="text-muted-foreground">vues</span>
                  </span>
                )}
              </div>

              {/* Caption */}
              {selectedPost.caption && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Légende</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPost.caption}
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Hashtags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.hashtags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                {selectedPost.timestamp && (
                  <span>
                    Publié {formatDistanceToNow(new Date(selectedPost.timestamp), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
                {selectedPost.url && (
                  <a
                    href={selectedPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir sur Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
