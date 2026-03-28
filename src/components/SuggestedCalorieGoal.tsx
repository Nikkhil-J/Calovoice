type Props = {
  /** TDEE-style suggestion from current stats (whole kcal). */
  liveSuggested: number
  /** Current daily goal in the form. */
  maintenanceCalories: number
  onUseSuggested: () => void
}

export function SuggestedCalorieGoal({
  liveSuggested,
  maintenanceCalories,
  onUseSuggested,
}: Props) {
  const usingSuggestion =
    Math.round(maintenanceCalories) === liveSuggested && maintenanceCalories > 0

  return (
    <div className="suggestion-bar">
      <span className="sg-text">
        Suggested: <strong>{liveSuggested}</strong> kcal/day
      </span>
      <span className="sg-right">
        {usingSuggestion && (
          <span className="sg-synced">&#10003; Using</span>
        )}
        <button
          type="button"
          className="sg-apply"
          disabled={usingSuggestion}
          onClick={onUseSuggested}
        >
          Apply
        </button>
      </span>
    </div>
  )
}
