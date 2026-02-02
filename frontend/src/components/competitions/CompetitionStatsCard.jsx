/**
 * 📊 Competition Stats Card
 * 
 * Card component แสดงสถิติ
 */
const CompetitionStatsCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-900'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-900'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-900'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-900'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-900'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${colors.text} mt-2`}>{value}</p>
        </div>
        <div className={`${colors.bg} p-3 rounded-lg`}>
          <div className={colors.icon}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionStatsCard;
