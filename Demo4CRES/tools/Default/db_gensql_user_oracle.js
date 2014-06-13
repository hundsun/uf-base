/************************************************************
   *** JSfile   : db_gensql_user_oracle.js
   *** Author   : yanwj06282
   *** Date     : 2012-11-14
   *** Notes    : 该用户脚本用于oracle数据库用户sql
  ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="数据库用户SQL";//说明信息
	
	/**
	 * 生成数据库用户SQL主函数(入口函数，此调用一般为外部通过脚本右键/执行调用)
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var info = project.getDBUser();
		var sqlBuffer = genDatabaseUserResource(info, context);
		var file_path = fileOutputLocation + "\\orTableUser.sql";
		file.write(file_path, stringutil.formatSql(sqlBuffer , "oracle") ,charset);
		file_path = file.getAbsolutePath();
		output.dialog("成功生成SQL文件，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
		output.info("成功生成SQL文件，生成路径为：" + file_path);
	}
	
	/**
	 * 生成数据库用户sql
	 * @param info
	 * @param context
	 * @returns
	 */
	function genDatabaseUserResource(/* DbUserResourceData */ info, /* Map<?, ?> */ context){
		var userBuffer = stringutil.getStringBuffer();
		
		var oracleUsers = info.getUsers();
		var userName;
		var userDesc;
		var userEnable;
		var userAttributes;
		var userPriName;
		var userPWD;
		var defaultTableSpace;
		
		for(var i in oracleUsers){
				
			userEnable = oracleUsers[i].getOriginalInfo().isEnable();
			if(!userEnable)//不启动不生成
				continue;
			userName = oracleUsers[i].getOriginalInfo().getName();
			userDesc = oracleUsers[i].getOriginalInfo().getDecription();
			userAttributes = oracleUsers[i].getOriginalInfo().getAttributes();
			userPWD = oracleUsers[i].getOriginalInfo().getPassword();
			defaultTableSpace = oracleUsers[i].getOriginalInfo().getDefaultTableSpace();
			
			if(stringutil.isBlank(userPWD)){
				output.warn("[" + userName + " ] :生成用户sql异常：密码为空!");
				continue;
			}
			//1、当密码是数字时，应该是双引号包裹；当密码是字符时可以没有包裹或双引号包裹；
			// 2、当用户密码已有双引号包裹，则不进行另外包裹；
			if (!stringutil.startsWith(userPWD , "\"")) {
				userPWD = "\""+userPWD;
			}
			if (!stringutil.endsWith(userPWD , "\"")) {
				userPWD = userPWD + "\"";
			}
			
			//创建用户创建脚本
			userBuffer.append("--删除用户  " + userName + "\r\n");
			userBuffer.append("declare\r\n");
			userBuffer.append("  v_rowcount integer;\r\n");
			userBuffer.append("begin\r\n");
			userBuffer.append("  select count(*) into v_rowcount from dual where exists(select * from all_users a where a.username = upper('" + userName + "'));\r\n");
			userBuffer.append("   if v_rowcount > 0 then\r\n");
			userBuffer.append(" 	  execute immediate 'DROP USER " + userName + " CASCADE';\r\n");
			userBuffer.append("   end if;\r\n");
			userBuffer.append("end;\r\n");
			userBuffer.append("/\r\n");
			userBuffer.append("\r\n");
			userBuffer.append("--创建用户  " + userName + "\r\n");
			userBuffer.append("CREATE USER " + userName + " IDENTIFIED BY  " + userPWD);
			if(defaultTableSpace != ""){//默认表空间
				userBuffer.append(" DEFAULT TABLESPACE " + defaultTableSpace );
			}
			//临时表空间
			userBuffer.append(" TEMPORARY TABLESPACE TEMP;\r\n");
			
			//赋权限
			userBuffer.append("--用户  " + userName + " 赋权限\r\n");
			var privileges = oracleUsers[i].getPrivileges();
			for(var j in privileges){
				var priv = privileges[j].getOriginalInfo().getName()
				userBuffer.append("GRANT " + priv + " TO " + userName + ";\r\n");
			}
			
			userBuffer.append("\r\n\r\n");
		}
		return userBuffer;
	}