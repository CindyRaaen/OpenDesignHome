import { useEffect, useState } from 'react'
import { Star, SkipForward } from 'lucide-react'
import { api } from '../utils/api'

export default function VotingPage() {
  const [currentDesign, setCurrentDesign] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [votedCount, setVotedCount] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    fetchNextDesign()
  }, [])

  const fetchNextDesign = async () => {
    setLoading(true)
    setRating(0)
    setHoveredRating(0)
    setHasVoted(false)
    try {
      const design = await api.get('/api/vote/pending')
      setCurrentDesign(design)
    } catch (err) {
      setCurrentDesign(null)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (stars) => {
    if (!currentDesign) return
    try {
      await api.post('/api/vote/submit', {
        designId: currentDesign.id,
        rating: stars,
      })
      setVotedCount(votedCount + 1)
      setHasVoted(true)
      setTimeout(() => fetchNextDesign(), 500)
    } catch (err) {
      alert('Error submitting vote: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-indigo-400">Loading design...</div>
      </div>
    )
  }

  if (!currentDesign) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">All Caught Up!</h2>
          <p className="text-gray-400 mb-2">You've voted on all pending designs.</p>
          <p className="text-lg font-semibold text-indigo-400">Total Votes: {votedCount}</p>
          <p className="text-sm text-gray-500 mt-4">Come back later for more designs to review.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400">Design Voting</h1>
        <div className="text-right">
          <p className="text-sm text-gray-400">Votes Cast</p>
          <p className="text-2xl font-bold text-indigo-400">{votedCount}</p>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-64 flex items-center justify-center">
          {currentDesign.previewImage ? (
            <img src={currentDesign.previewImage} alt="Design" className="w-full h-full object-cover" />
          ) : (
            <div className="text-white text-6xl">🏠</div>
          )}
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">{currentDesign.title}</h2>
          <p className="text-gray-400 mb-4">by {currentDesign.designer}</p>

          <div className="bg-gray-700 rounded p-4 mb-8">
            <p className="text-gray-200 mb-4">{currentDesign.description || 'A beautiful design'}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Challenge</p>
                <p className="text-white font-semibold">{currentDesign.challengeTitle}</p>
              </div>
              <div>
                <p className="text-gray-400">Items Used</p>
                <p className="text-white font-semibold">{currentDesign.itemCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded p-6 mb-6">
            <p className="text-white font-bold mb-4 text-center">How do you rate this design?</p>
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleVote(star)}
                  className="transition transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-gray-400 text-sm">
              {hoveredRating ? `Rating: ${hoveredRating} stars` : rating ? `You rated: ${rating} stars` : 'Click to rate'}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => fetchNextDesign()}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded transition flex items-center justify-center gap-2"
            >
              <SkipForward size={20} />
              Skip
            </button>
            {rating > 0 && (
              <button
                onClick={() => handleVote(rating)}
                disabled={hasVoted}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-bold py-3 rounded transition"
              >
                {hasVoted ? 'Voted!' : 'Submit Vote'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}