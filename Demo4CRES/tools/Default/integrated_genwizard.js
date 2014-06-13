/************************************************************
 *** JSfile   : call_script.js
 *** Author   : liao
 *** Date     : 2014-2-24
 *** Notes    : 统一向导对应的js,调用其他的js完成一次执行完成多个脚本调用功能:用户可以根据自己的需要选择选择相应的脚本
 ************************************************************/


	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		//脚本需要调用脚本列表:用户不同要求选择不同的脚本
		//["数据库","Default/db_gensql_oracle.js"]:["脚本简短描述","相对工具资源的脚本路径"]
		var scripts = [["数据库","Default/db_gensql_oracle.js"],["表注释生成","Default/db_gensql_comment_oracle.js"],["数据库表空间","Default/db_gensql_ts_oracle.js"],["数据库用户","Default/db_gensql_user_oracle.js"],["数据类型","Default/datatype_gensql_oracle.js"],["数据字典","O4/dict_gensql_oracle.js"],["原子","O4/atom_gencode.js"],["逻辑","O4/logic_gencode.js"]];
		project.runSrcipt(scripts);
	}
