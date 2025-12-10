// Add this function after refreshStats() in AdminPanel.jsx

  // Process badges manually and show results
  const processBadgesManually = async () => {
    setIsProcessingBadges(true)
    setBadgeResults(null)
    
    try {
      // Check if month is complete
      if (!isMonthAttendanceComplete()) {
        toast.error('Month is not complete yet. All Sundays must have attendance data.')
        setIsProcessingBadges(false)
        return
      }

      const results = {
        qualified: [],
        notQualified: [],
        totalProcessed: 0
      }

      // Check each member for 3 consecutive Sundays
      for (const member of members) {
        results.totalProcessed++
        
        // Check for 3 consecutive Present attendances
        const sortedSundays = [...availableSundayDates].sort((a, b) => a - b)
        let consecutiveCount = 0
        let hasThreeConsecutive = false
        
        for (const sunday of sortedSundays) {
          const dateKey = sunday.toISOString().split('T')[0]
          const memberStatus = attendanceData[dateKey]?.[member.id]
          
          if (memberStatus === true) {
            consecutiveCount++
            if (consecutiveCount >= 3) {
              hasThreeConsecutive = true
              break
            }
          } else if (memberStatus === false) {
            consecutiveCount = 0
          } else {
            consecutiveCount = 0
          }
        }

        const memberInfo = {
          id: member.id,
          name: member['full_name'] || member['Full Name'],
          phone: member['Phone Number'] || member['phone_number'] || 'No phone',
          currentBadge: member['Badge Type'] || 'newcomer'
        }

        if (hasThreeConsecutive) {
          // Only update if not already regular or vip
          if (member['Badge Type'] !== 'regular' && member['Badge Type'] !== 'vip') {
            await updateMember(member.id, {
              'Badge Type': 'regular',
              'Member Status': 'Member'
            })
            memberInfo.badgeAssigned = true
          } else {
            memberInfo.badgeAssigned = false
            memberInfo.reason = 'Already has regular or vip badge'
          }
          results.qualified.push(memberInfo)
        } else {
          memberInfo.reason = 'Did not attend 3 consecutive Sundays'
          results.notQualified.push(memberInfo)
        }
      }

      setBadgeResults(results)
      toast.success(`Badge processing complete! ${results.qualified.filter(m => m.badgeAssigned).length} badges assigned.`)
    } catch (error) {
      console.error('Error processing badges:', error)
      toast.error('Failed to process badges')
    } finally {
      setIsProcessingBadges(false)
    }
  }
