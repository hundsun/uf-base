/************************************************************
   *** JSfile   : db_gensql_ts_oracle.js
   *** Author   : yanwj06282
   *** Date     : 2012-11-14
   *** Notes    : 该用户脚本用于生成数据库表空间SQL
   *表空间的默认扩展大小和段空间管理方式，采用系统自动维护
  ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="数据库表空间SQL";//说明信息
	
	/**
	 * 生成数据库表空间SQL主函数(入口函数，此调用一般为外部通过脚本右键/执行调用)
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var info = project.getTableSpace();
		var sqlBuffer = genTableSpaceResource(info, context);
		var file_path = fileOutputLocation + "\\orTableSpace.sql";
		file.write(file_path, stringutil.formatSql(sqlBuffer , "oracle") ,charset);
		file_path = file.getAbsolutePath();
		output.dialog("成功生成SQL文件，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
		output.info("成功生成SQL文件，生成路径为：" + file_path);
	}
	
	/**
	 * 生成oracle数据库表空间sql
	 * 
	 * @param info
	 * @param context
	 * @returns
	 */
	function genTableSpaceResource(/* TableSpaceResourceData */ info, /* Map<?, ?> */ context){
		var spaceBuffer = stringutil.getStringBuffer();
		var tableSpaces = info.getSpace();
		var spacesName;
		var spacesChineseName;
		var spacesDesc;
		var spacesSize;
		var spacesFile;
		var spacesUser;
		for(var i in tableSpaces){
			spacesName = tableSpaces[i].getOriginalInfo().getName();
			spacesChineseName = tableSpaces[i].getOriginalInfo().getChineseName();
			spacesDesc = tableSpaces[i].getOriginalInfo().getDescription();
			spacesSize = tableSpaces[i].getOriginalInfo().getSize();
			spacesFile = tableSpaces[i].getOriginalInfo().getFile();
			spacesUser = tableSpaces[i].getOriginalInfo().getUser();

			spaceBuffer.append("--创建表空间" + spacesName + "\r\n");
			spaceBuffer.append("create tablespace " + spacesName + " \r\n");
			spaceBuffer.append("datafile '" + spacesFile + "'\r\n");
			if(spacesSize != null && spacesSize != ""){
				spaceBuffer.append("size " + spacesSize + "\r\n");
			}
			var autoextend = tableSpaces[i].getExtendsValue("autoextend");
			var maxsize = tableSpaces[i].getExtendsValue("maxsize");
			if (stringutil.isNotBlank(autoextend)) {
				spaceBuffer.append("autoextend on\r\n");
				spaceBuffer.append("next "+autoextend+" maxsize "+maxsize+"\r\n");
			}
			spaceBuffer.append("extent management local\r\n");
			spaceBuffer.append("segment space management auto;\r\n\r\n");
		}
		spaceBuffer.append("\r\n\r\n")
		return spaceBuffer;
	}