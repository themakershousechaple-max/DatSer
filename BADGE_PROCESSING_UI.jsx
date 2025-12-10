// Add this JSX after the Monthly Databases section in AdminPanel.jsx
// Insert it before the "Member Names Display" section

        {/* Badge Processing Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Badge Processing</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Process badges for members who attended 3 consecutive Sundays
              </p>
            </div>
            <button
              onClick={processBadgesManually}
              disabled={isProcessingBadges}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Award className="w-4 h-4 mr-2" />
              {isProcessingBadges ? 'Processing...' : 'Process Badges'}
            </button>
          </div>

          {/* Badge Results */}
          {badgeResults && (
            <div className="space-y-4 mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Processed</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{badgeResults.totalProcessed}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <Award className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Got Badges</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{badgeResults.qualified.filter(m => m.badgeAssigned).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <X className="w-8 h-8 text-red-600 dark:text-red-400 mr-3" />
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">Didn't Get Badges</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">{badgeResults.notQualified.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members Who Didn't Get Badges - With Contact Numbers */}
              {badgeResults.notQualified.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-3 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Members to Contact ({badgeResults.notQualified.length})
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    These members didn't attend 3 consecutive Sundays. Call them to encourage attendance!
                  </p>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {badgeResults.notQualified.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-300 dark:border-red-700"
                        >
                          <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {member.phone}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{member.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Members Who Got Badges */}
              {badgeResults.qualified.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Members Who Qualified ({badgeResults.qualified.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {badgeResults.qualified.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-300 dark:border-green-700"
                        >
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{member.name}</p>
                          {member.badgeAssigned ? (
                            <p className="text-xs text-green-600 dark:text-green-400">✓ Badge assigned</p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
